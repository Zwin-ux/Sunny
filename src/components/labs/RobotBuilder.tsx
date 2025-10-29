'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, Zap, ArrowUp, ArrowRight, ArrowLeft, Volume2 } from 'lucide-react';

interface RobotPart {
  id: string;
  name: string;
  emoji: string;
  type: 'head' | 'body' | 'arms' | 'legs' | 'accessory';
}

interface Command {
  id: string;
  action: 'move' | 'turn_right' | 'turn_left' | 'beep';
  icon: React.ReactNode;
  label: string;
}

const ROBOT_PARTS: RobotPart[] = [
  { id: 'head-1', name: 'Round Head', emoji: '🤖', type: 'head' },
  { id: 'head-2', name: 'Square Head', emoji: '📦', type: 'head' },
  { id: 'body-1', name: 'Body', emoji: '🎮', type: 'body' },
  { id: 'body-2', name: 'Strong Body', emoji: '🔋', type: 'body' },
  { id: 'arms-1', name: 'Arms', emoji: '🦾', type: 'arms' },
  { id: 'legs-1', name: 'Wheels', emoji: '🛞', type: 'legs' },
  { id: 'legs-2', name: 'Legs', emoji: '🦿', type: 'legs' },
  { id: 'accessory-1', name: 'Antenna', emoji: '📡', type: 'accessory' },
];

const COMMANDS: Command[] = [
  { id: 'move', action: 'move', icon: <ArrowUp className="w-5 h-5" />, label: 'Move Forward' },
  { id: 'turn_right', action: 'turn_right', icon: <ArrowRight className="w-5 h-5" />, label: 'Turn Right' },
  { id: 'turn_left', action: 'turn_left', icon: <ArrowLeft className="w-5 h-5" />, label: 'Turn Left' },
  { id: 'beep', action: 'beep', icon: <Volume2 className="w-5 h-5" />, label: 'Beep' },
];

export default function RobotBuilder() {
  const [selectedParts, setSelectedParts] = useState<{
    head?: RobotPart;
    body?: RobotPart;
    arms?: RobotPart;
    legs?: RobotPart;
    accessory?: RobotPart;
  }>({});

  const [program, setProgram] = useState<Command[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [robotPosition, setRobotPosition] = useState({ x: 0, y: 0 });
  const [robotRotation, setRobotRotation] = useState(0);
  const [output, setOutput] = useState<string[]>([]);

  const sensors = useSensors(useSensor(PointerSensor));

  const selectPart = (part: RobotPart) => {
    setSelectedParts((prev) => ({
      ...prev,
      [part.type]: part,
    }));
  };

  const removePart = (type: string) => {
    setSelectedParts((prev) => {
      const newParts = { ...prev };
      delete newParts[type as keyof typeof prev];
      return newParts;
    });
  };

  const addCommand = (command: Command) => {
    setProgram((prev) => [...prev, command]);
  };

  const removeCommand = (index: number) => {
    setProgram((prev) => prev.filter((_, i) => i !== index));
  };

  const clearProgram = () => {
    setProgram([]);
    setOutput([]);
  };

  const runProgram = async () => {
    setIsRunning(true);
    setOutput([]);

    let x = 0;
    let y = 0;
    let rotation = 0;

    for (const command of program) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      switch (command.action) {
        case 'move':
          // Move in current direction
          if (rotation === 0) y -= 50; // Up
          else if (rotation === 90) x += 50; // Right
          else if (rotation === 180) y += 50; // Down
          else if (rotation === 270) x -= 50; // Left
          setOutput((prev) => [...prev, '🚶 Moved forward']);
          break;
        case 'turn_right':
          rotation = (rotation + 90) % 360;
          setOutput((prev) => [...prev, '↪️ Turned right']);
          break;
        case 'turn_left':
          rotation = (rotation - 90 + 360) % 360;
          setOutput((prev) => [...prev, '↩️ Turned left']);
          break;
        case 'beep':
          setOutput((prev) => [...prev, '🔊 BEEP!']);
          break;
      }

      setRobotPosition({ x, y });
      setRobotRotation(rotation);
    }

    setIsRunning(false);
    setOutput((prev) => [...prev, '✅ Program complete!']);
  };

  const resetRobot = () => {
    setRobotPosition({ x: 0, y: 0 });
    setRobotRotation(0);
    setOutput([]);
  };

  const isRobotComplete = selectedParts.head && selectedParts.body && selectedParts.legs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Robot Assembly */}
          <div>
            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
              <h2 className="text-2xl font-black mb-4">🔧 Build Your Robot</h2>
              <p className="text-gray-600 mb-4">Drag parts to build your robot!</p>

              {/* Robot Display */}
              <div className="bg-gray-100 p-8 rounded-xl border-2 border-black min-h-[300px] flex flex-col items-center justify-center mb-6">
                <motion.div
                  animate={{
                    x: robotPosition.x,
                    y: robotPosition.y,
                    rotate: robotRotation,
                  }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  {/* Accessory */}
                  {selectedParts.accessory && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-5xl cursor-pointer"
                      onClick={() => removePart('accessory')}
                    >
                      {selectedParts.accessory.emoji}
                    </motion.div>
                  )}

                  {/* Head */}
                  {selectedParts.head && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-6xl cursor-pointer"
                      onClick={() => removePart('head')}
                    >
                      {selectedParts.head.emoji}
                    </motion.div>
                  )}

                  {/* Arms + Body */}
                  <div className="flex items-center">
                    {selectedParts.arms && (
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="text-5xl cursor-pointer"
                        onClick={() => removePart('arms')}
                      >
                        {selectedParts.arms.emoji}
                      </motion.div>
                    )}

                    {selectedParts.body && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-6xl cursor-pointer mx-2"
                        onClick={() => removePart('body')}
                      >
                        {selectedParts.body.emoji}
                      </motion.div>
                    )}

                    {selectedParts.arms && <div className="text-5xl opacity-0">{selectedParts.arms.emoji}</div>}
                  </div>

                  {/* Legs */}
                  {selectedParts.legs && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-6xl cursor-pointer"
                      onClick={() => removePart('legs')}
                    >
                      {selectedParts.legs.emoji}
                    </motion.div>
                  )}
                </motion.div>

                {!isRobotComplete && (
                  <p className="text-gray-500 mt-4 text-center">
                    Add at least a head, body, and legs to complete your robot!
                  </p>
                )}
              </div>

              {/* Parts Selector */}
              <div className="grid grid-cols-4 gap-3">
                {ROBOT_PARTS.map((part) => (
                  <motion.button
                    key={part.id}
                    onClick={() => selectPart(part)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-white rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <div className="text-3xl mb-1">{part.emoji}</div>
                    <div className="text-xs font-bold">{part.name}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Programming Panel */}
          <div>
            <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
              <h2 className="text-2xl font-black mb-4">💻 Program Your Robot</h2>
              <p className="text-gray-600 mb-4">Add commands to make your robot move!</p>

              {/* Command Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {COMMANDS.map((command) => (
                  <Button
                    key={command.id}
                    onClick={() => addCommand(command)}
                    disabled={!isRobotComplete || isRunning}
                    variant="outline"
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {command.icon}
                      <span className="text-xs">{command.label}</span>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Program Display */}
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300 min-h-[150px] mb-4">
                <div className="flex flex-col gap-2">
                  {program.length === 0 ? (
                    <p className="text-gray-500 text-center">No commands yet. Add some commands!</p>
                  ) : (
                    program.map((command, index) => (
                      <motion.div
                        key={`${command.id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between bg-white p-2 rounded border border-black"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{index + 1}.</span>
                          {command.icon}
                          <span>{command.label}</span>
                        </div>
                        <button
                          onClick={() => removeCommand(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={runProgram}
                  disabled={program.length === 0 || !isRobotComplete || isRunning}
                  className="flex-1"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isRunning ? 'Running...' : 'Run Program'}
                </Button>
                <Button onClick={clearProgram} variant="outline" disabled={isRunning}>
                  Clear
                </Button>
                <Button onClick={resetRobot} variant="outline" disabled={isRunning}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Output Log */}
            {output.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black text-green-400 p-4 rounded-2xl border-2 border-green-500 font-mono text-sm"
              >
                <div className="font-bold mb-2">📟 Output:</div>
                {output.map((line, index) => (
                  <div key={index}>&gt; {line}</div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
