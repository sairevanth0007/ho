"use client";

import React from "react";
import { Navbar3 } from "../components/common/Navbar";
import { Header64 } from "../components/About/Header64";
import { Layout89 } from "../components/About/Layout89";
import { Team2 } from "../components/About/Team2";
import { Timeline13 } from "../components/About/Timeline13";
import { Logo6 } from "../components/About/Logo6";
import { Cta27 } from "../components/About/Cta27";
import { Footer4 } from "../components/common/Footer";

const AboutUsPage: React.FC = () => {
  return (
    <>
      {/* <Navbar3 /> */}
      <Header64 />
      <Layout89 />
      <Team2 />
      <Timeline13 />
      <Logo6 />
      <Cta27 />
      {/* <Footer4 /> */}
    </>
  );
};

export default AboutUsPage;
