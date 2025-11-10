// src/components/common/Preloader.tsx

import React from "react";
import { motion, type Variants } from "framer-motion";
import dermaglareLogo from "../../assets/dermaglare-logo.png";

const CreativePreloader: React.FC = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5, rotate: -180 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 1,
      },
    },
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.5 },
    },
  };

  const spinnerVariants: Variants = {
    animate: {
      rotate: 360,
      transition: { duration: 2, repeat: Infinity, ease: "linear" },
    },
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-brand-teal via-brand-teal-dark to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-brand-yellow rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-brand-yellow-light rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center flex flex-col items-center relative z-10"
      >
        {/* Logo */}
        <motion.div variants={logoVariants} className="mb-8 relative">
          <motion.div
            variants={spinnerVariants}
            animate="animate"
            className="absolute inset-0 rounded-full border-4 border-brand-yellow border-t-transparent"
            style={{ padding: "20px", margin: "-20px" }}
          />
          <div className="relative p-8 bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl">
            <img
              src={dermaglareLogo}
              alt="Dermaglare Logo"
              className="w-32 h-32 object-contain drop-shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div variants={textVariants} className="space-y-4">
          <h1 className="text-5xl font-bold text-brand-yellow drop-shadow-lg tracking-wide">
            Dermaglare
          </h1>
          <p className="text-2xl text-white font-light tracking-wider">
            Admin Portal
          </p>
          <motion.div
            className="flex items-center justify-center gap-2 mt-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-2 h-2 bg-brand-yellow rounded-full" />
            <div
              className="w-2 h-2 bg-brand-yellow rounded-full"
              style={{ animationDelay: "0.2s" }}
            />
            <div
              className="w-2 h-2 bg-brand-yellow rounded-full"
              style={{ animationDelay: "0.4s" }}
            />
          </motion.div>
          <p className="text-white/60 text-sm mt-4">Initializing Services...</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CreativePreloader;
