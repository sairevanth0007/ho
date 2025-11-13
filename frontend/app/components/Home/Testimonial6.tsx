"use client";

import React from "react";
import { BiSolidStar } from "react-icons/bi";

const testimonials = [
  {
    quote: `"GenerativeIDE helps me code even in the remotest places. No lag, no internet — just pure productivity."`,
    name: "Rahul Iyer",
    role: "Frontend Developer",
  },
  {
    quote: `"Being a DevOps engineer, I love how I can spin up scripts offline. It's fast and doesn’t spy on my code."`,
    name: "Priya Menon",
    role: "DevOps Engineer",
  },
  {
    quote: `"I’ve tried cloud AIs — nothing beats the speed and security of GenerativeIDE for backend logic generation."`,
    name: "Arvind Reddy",
    role: "Backend Engineer",
  },
  {
    quote: `"Writing React components offline feels like magic. The inline autocomplete is smarter than Copilot."`,
    name: "Sneha Kulkarni",
    role: "React Developer",
  },
  {
    quote: `"Offline AI is a game-changer. No upload delays, no privacy concerns — it just works locally."`,
    name: "Ritika Deshmukh",
    role: "QA Analyst",
  },
  {
    quote: `"As a mobile dev, I can’t believe how much faster this is than GitHub Copilot. And offline? Unbeatable."`,
    name: "Kunal Bansal",
    role: "Android Developer",
  },
  {
    quote: `"I generate unit tests in seconds — no internet required. This is how AI should’ve been from the start."`,
    name: "Megha Joshi",
    role: "SDET",
  },
  {
    quote: `"Editing code with natural language locally is surreal. It’s replaced so many of my extensions."`,
    name: "Tanmay Rao",
    role: "Full-Stack Developer",
  },
  {
    quote: `"Perfect for secure environments where online tools are banned. Productivity doubled."`,
    name: "Nisha Verma",
    role: "Azure Administrator",
  },
  {
    quote: `"The AI understands file relationships better than any online assistant I’ve used."`,
    name: "Siddharth Nair",
    role: "Java Developer",
  },
  {
    quote: `"No telemetry, no spying — just blazing fast suggestions that actually make sense."`,
    name: "Yash Tiwari",
    role: "Python Developer",
  },
  {
    quote: `"Even during a power cut and no Wi-Fi, I could still debug code like a pro."`,
    name: "Aarti Sharma",
    role: "System Analyst",
  },
  {
    quote: `"Ghost suggestions feel natural and unobtrusive. Like having a coding buddy offline."`,
    name: "Manoj Pillai",
    role: "Go Developer",
  },
  {
    quote: `"Finally, an AI tool that respects privacy and still outperforms cloud ones."`,
    name: "Bhavna Patil",
    role: "Security Engineer",
  },
  {
    quote: `"It just works. No loading spinners, no API quota errors. Offline is the way."`,
    name: "Rohan Shetty",
    role: "Web Developer",
  },
  {
    quote: `"Legacy code isn’t scary anymore. I can explain blocks and generate tests offline."`,
    name: "Neha Kapoor",
    role: "Tech Support Engineer",
  },
  {
    quote: `"Scary good test generation — and I don’t even need Wi-Fi to use it."`,
    name: "Pratik Chavan",
    role: "Automation Tester",
  },
  {
    quote: `"Ideal for firmware and embedded projects. The offline flow is a blessing."`,
    name: "Smita Jha",
    role: "Firmware Engineer",
  },
  {
    quote: `"Offline VSCode extensions were never this good. Feels like the future of AI dev."`,
    name: "Vivek Krishnan",
    role: "Node.js Developer",
  },
  {
    quote: `"I had doubts, but this replaced both Copilot and ChatGPT for me."`,
    name: "Anjali Mehta",
    role: "TypeScript Developer",
  },
  {
    quote: `"It’s light, it’s fast, and it just keeps improving my code quality."`,
    name: "Nitin Rathi",
    role: "C++ Engineer",
  },
  {
    quote: `"I don’t need 10 tabs open anymore. GenerativeIDE handles it all — offline."`,
    name: "Tanya Das",
    role: "Frontend Developer",
  },
  {
    quote: `"This feels like my own personal offline assistant. Always available."`,
    name: "Devendra Jain",
    role: "Laravel Developer",
  },
  {
    quote: `"We needed an air-gapped solution. This nailed it with speed and reliability."`,
    name: "Geeta Yadav",
    role: "Systems Engineer",
  },
  {
    quote: `"Even on 8GB RAM, it's buttery smooth. No bloat, just brains."`,
    name: "Abhinav Mukherjee",
    role: "Remote Developer",
  },
  {
    quote: `"Great refactor suggestions without messing up formatting. Offline FTW."`,
    name: "Rakesh Bhatt",
    role: "Data Engineer",
  },
  {
    quote: `"Love the command palette AI controls. Feels like superpowers."`,
    name: "Pallavi Sinha",
    role: "iOS Developer",
  },
  {
    quote: `"Feels like an IDE from the future, but runs today — no internet needed."`,
    name: "Sagar Kulkarni",
    role: "React Native Developer",
  },
  {
    quote: `"Helped me finish a weekend hackathon on a train. That’s how useful it is."`,
    name: "Ritika Narang",
    role: "Rust Developer",
  },
  {
    quote: `"Offline stack trace analysis? Unheard of — until now."`,
    name: "Varun Gokhale",
    role: "PHP Developer",
  },
  {
    quote: `"The diff preview before applying changes is a lifesaver. Total trust."`,
    name: "Neeraj Chopra",
    role: "Scala Developer",
  },
  {
    quote: `"No more latency, no more tokens. Just pure offline productivity."`,
    name: "Divya Rao",
    role: "Technical Writer",
  },
  {
    quote: `"Having AI autocomplete without lag is honestly addicting."`,
    name: "Ravindra Joshi",
    role: "Ruby Developer",
  },
  {
    quote: `"My debugging speed has tripled thanks to this tool."`,
    name: "Kavita Rani",
    role: "QA Engineer",
  },
  {
    quote: `"Perfect for students like me who code in labs without internet."`,
    name: "Rajeev Krishnan",
    role: "CS Student",
  },
  {
    quote: `"The AI understands not just the syntax but intent. Offline!"`,
    name: "Meera Shah",
    role: "DevOps Specialist",
  },
  {
    quote: `"Way smarter than IntelliSense. And it works fully offline!"`,
    name: "Sumit Chauhan",
    role: "DotNet Developer",
  },
  {
    quote: `"Helps me write better, safer code — no internet risk involved."`,
    name: "Nivedita Joshi",
    role: "API Developer",
  },
  {
    quote: `"So helpful for solo founders like me working in low-bandwidth zones."`,
    name: "Aman Jindal",
    role: "Indie Hacker",
  },
  {
    quote: `"The autocomplete engine is cleaner than any cloud tool I've tested."`,
    name: "Shreya Pillai",
    role: "Software Intern",
  },

  // 10 Americans
  {
    quote: `"The offline capability alone makes it worth it — but it's actually smarter too."`,
    name: "Jason Miller",
    role: "Full Stack Developer",
  },
  {
    quote: `"I get results faster than I ever did with cloud-based tools. No waiting!"`,
    name: "Emily Sanders",
    role: "Python Developer",
  },
  {
    quote: `"Perfect for on-site development where cloud AI isn't allowed."`,
    name: "Michael Brown",
    role: "Government Contractor",
  },
  {
    quote: `"I’ve seen ghost text before, but this one feels intelligent and helpful."`,
    name: "Jennifer Lee",
    role: "React Engineer",
  },
  {
    quote: `"Even on planes, trains, or cafes — I have my AI coding buddy."`,
    name: "Kevin Nguyen",
    role: "iOS Developer",
  },
  {
    quote: `"It respects privacy, accelerates coding, and doesn’t slow down VSCode."`,
    name: "Ashley Rivera",
    role: "Web Developer",
  },
  {
    quote: `"All my extensions are cloud-tied. This one? Fully offline. 10/10."`,
    name: "Brian Thompson",
    role: "Back-End Engineer",
  },
  {
    quote: `"No telemetry, no lag — just clean, context-aware coding help."`,
    name: "Samantha Adams",
    role: "Freelance Developer",
  },
  {
    quote: `"I stopped using Copilot after a week with GenerativeIDE."`,
    name: "Eric Johnson",
    role: "QA Automation Engineer",
  },
  {
    quote: `"I didn’t expect it to work this well offline. Blew me away."`,
    name: "Natalie Brooks",
    role: "Cloud Engineer",
  }
];


const Testimonial6: React.FC = () => {
  return (
    <section
      id="relume"
      className="px-[5%] py-16 md:py-24 lg:py-28 overflow-hidden bg-transparent"
    >
      <div className="container">
      <div className="mb-12 w-full text-center md:mb-18 lg:mb-20">
  <h1 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
    Customer Testimonials
  </h1>
  <p className="md:text-md">
    This tool has transformed our workflow completely!
  </p>
  <p className="mt-2 md:text-md">
    We tested GenerativeIDE with our developer community — here’s what they had to say.
  </p>
</div>


        <div className="relative w-full overflow-hidden">
          <div className="flex w-max animate-scroll gap-8">
            {[...testimonials, ...testimonials].map(({ quote, name, role }, idx) => (
              <div
                key={idx}
                className="flex w-[320px] flex-shrink-0 flex-col items-start justify-start text-left backdrop-blur-md hover:bg-white/10 transition-all duration-300 border border-white/10 rounded-xl p-6"
              >
                <div className="mb-4 flex text-yellow-400">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <BiSolidStar key={i} className="size-5" />
                    ))}
                </div>
                <blockquote className="text-sm leading-[1.4] font-bold md:text-base">
                  {quote}
                </blockquote>
                <div className="mt-4 flex flex-col">
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-white/70">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Testimonial6 };
