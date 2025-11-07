/**
 * GET /api/agents/graph/:student_id
 *
 * Retrieve learning graph snapshot for a student
 * Returns knowledge map, mastery levels, and recommended paths
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/db';
import { isDemoMode } from '@/lib/runtimeMode';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { student_id: string } }
) {
  try {
    const { student_id } = params;

    const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimit(identifier, '/api/agents/graph', 60, 60);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id' },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      // Demo mode response
      return NextResponse.json({
        success: true,
        demo_mode: true,
        student_id,
        graph: {
          nodes: [
            {
              id: 'node-1',
              type: 'concept',
              label: 'Addition',
              mastery_level: 'mastered',
              mastery_probability: 0.92,
            },
            {
              id: 'node-2',
              type: 'concept',
              label: 'Subtraction',
              mastery_level: 'proficient',
              mastery_probability: 0.75,
            },
            {
              id: 'node-3',
              type: 'concept',
              label: 'Multiplication',
              mastery_level: 'developing',
              mastery_probability: 0.45,
            },
          ],
          edges: [
            {
              source: 'node-1',
              target: 'node-2',
              type: 'prerequisite',
              strength: 0.8,
            },
            {
              source: 'node-2',
              target: 'node-3',
              type: 'prerequisite',
              strength: 0.9,
            },
          ],
          recommended_next: ['node-3'],
          concepts_due_for_review: ['node-2'],
        },
      });
    }

    // Production: Query learning graph from database
    const supabase = createClient();

    // Get student's mastery data
    const { data: masteryData, error: masteryError } = await supabase
      .from('student_node_mastery')
      .select(
        `
        *,
        learning_graph_nodes(id, node_type, label, description, subject, grade_level)
      `
      )
      .eq('student_id', student_id);

    if (masteryError) {
      throw masteryError;
    }

    // Get recommended next nodes
    const { data: nextNodes, error: nextNodesError } = await supabase.rpc(
      'get_next_best_nodes',
      {
        p_student_id: student_id,
        p_limit: 5,
      }
    );

    if (nextNodesError) {
      console.error('Error fetching next nodes:', nextNodesError);
    }

    // Get graph structure (nodes + edges)
    const { data: graphData, error: graphError } = await supabase
      .from('learning_graph_nodes')
      .select(
        `
        id,
        node_type,
        label,
        description,
        subject,
        grade_level,
        bloom_level,
        edges_from:learning_graph_edges!learning_graph_edges_source_node_id_fkey(
          target_node_id,
          edge_type,
          strength
        )
      `
      )
      .eq('is_active', true);

    if (graphError) {
      throw graphError;
    }

    return NextResponse.json({
      success: true,
      student_id,
      graph: {
        nodes: graphData || [],
        mastery: masteryData || [],
        recommended_next: nextNodes || [],
        concepts_due_for_review: (masteryData || [])
          .filter((m: any) => {
            const reviewDate = new Date(m.next_review_at);
            return reviewDate <= new Date();
          })
          .map((m: any) => m.node_id),
      },
    });
  } catch (error) {
    console.error('[API /agents/graph] Error:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve learning graph', details: (error as Error).message },
      { status: 500 }
    );
  }
}
