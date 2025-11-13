import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, CheckCircle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRandomCelebrationGif, getAvatarUrl } from "@/lib/avatars";

interface AnimatedDismissalCardProps {
  studentName: string;
  grade: string;
  class: string;
  parentName: string;
  time: string;
  gate: string;
  avatarUrl?: string | null;
  isNew?: boolean;
  isCompleted?: boolean;
  index?: number;
}

export default function AnimatedDismissalCard({
  studentName,
  grade,
  class: className,
  parentName,
  time,
  gate,
  avatarUrl,
  isNew,
  isCompleted,
  index = 0
}: AnimatedDismissalCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [celebrationGif, setCelebrationGif] = useState<string>("");
  const [wasCompleted, setWasCompleted] = useState(isCompleted);

  const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase();
  const finalAvatarUrl = getAvatarUrl(avatarUrl);

  // Detect when card becomes completed and trigger flip animation
  useEffect(() => {
    if (isCompleted && !wasCompleted) {
      const gif = getRandomCelebrationGif();
      setCelebrationGif(gif.url);
      setIsFlipped(true);

      // Flip back after 2.5 seconds
      const timer = setTimeout(() => {
        setIsFlipped(false);
      }, 2500);

      setWasCompleted(true);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, wasCompleted]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.1,
      }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        style={{ transformStyle: "preserve-3d", position: "relative" }}
      >
        {/* Front of card - Student info */}
        <motion.div
          style={{
            backfaceVisibility: "hidden",
            position: isFlipped ? "absolute" : "relative",
            width: "100%",
          }}
        >
          <Card
            className={`
              hover-elevate transition-all duration-300
              ${isNew ? 'border-[#FF3547] border-2 shadow-lg shadow-[#FF3547]/20 animate-pulse-border' : ''}
              ${isCompleted ? 'opacity-60' : ''}
            `}
            data-testid={`card-dismissal-${studentName.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <CardContent className="p-4 relative overflow-hidden">
              {/* Animated background for new dismissals */}
              {isNew && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#FF3547]/10 via-transparent to-[#FF3547]/10"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}

              <div className="flex items-start gap-3 relative z-10">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-primary/20">
                    {finalAvatarUrl && <AvatarImage src={finalAvatarUrl} alt={studentName} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base truncate" data-testid="text-student-name">
                      {studentName}
                    </h3>

                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <CheckCircle className="w-5 h-5 text-[#00C851] flex-shrink-0" />
                      </motion.div>
                    ) : isNew ? (
                      <motion.div
                        className="flex items-center gap-1 flex-shrink-0"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                      >
                        <motion.div
                          className="relative w-2 h-2 rounded-full bg-[#FF3547]"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(255, 53, 71, 0.7)",
                              "0 0 0 8px rgba(255, 53, 71, 0)",
                            ],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                          }}
                        />
                        <span className="text-xs font-semibold text-[#FF3547]">NEW</span>
                      </motion.div>
                    ) : (
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>G{grade} • C{className}</span>
                    <span className="truncate">• {parentName}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2 gap-2">
                    <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                      <MapPin className="w-3 h-3 mr-1" />
                      {gate}
                    </Badge>
                    <span className="text-xs text-muted-foreground" data-testid="text-time">{time}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back of card - Celebration GIF */}
        <motion.div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            rotateY: 180,
          }}
        >
          <Card className="border-[#00C851] border-2 shadow-lg shadow-[#00C851]/30">
            <CardContent className="p-4">
              <div className="flex flex-col items-center justify-center h-full min-h-[100px]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="w-full"
                >
                  {celebrationGif && (
                    <img
                      src={celebrationGif}
                      alt="Celebration!"
                      className="w-full h-32 object-contain rounded-lg"
                    />
                  )}
                  <motion.p
                    className="text-center font-bold text-[#00C851] mt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    🎉 {studentName} picked up! 🎉
                  </motion.p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
