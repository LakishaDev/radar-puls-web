"use client";

import {motion, useReducedMotion} from "framer-motion";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? {opacity: 0} : {opacity: 0, y: 14}}
      whileInView={reduceMotion ? {opacity: 1} : {opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.2}}
      transition={
        reduceMotion
          ? {duration: 0.2, delay}
          : {type: "spring", stiffness: 120, damping: 20, mass: 0.6, delay}
      }
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{once: true, amount: 0.2}}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduceMotion ? 0 : 0.07,
            delayChildren: reduceMotion ? 0 : 0.02,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({children, className}: {children: React.ReactNode; className?: string}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduceMotion ? {opacity: 0} : {opacity: 0, y: 12},
        visible: reduceMotion ? {opacity: 1} : {opacity: 1, y: 0},
      }}
      transition={
        reduceMotion
          ? {duration: 0.2}
          : {type: "spring", stiffness: 140, damping: 20, mass: 0.7}
      }
    >
      {children}
    </motion.div>
  );
}
