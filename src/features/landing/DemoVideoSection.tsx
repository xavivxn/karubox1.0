"use client";

import { motion } from "framer-motion";
import DemoVideoCard from "./DemoVideoCard";

export default function DemoVideoSection() {
  return (
    <section
      id="demo-video"
      className="relative z-10 hidden md:block -mt-10 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 scroll-mt-24"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <DemoVideoCard />
        </motion.div>
      </div>
    </section>
  );
}
