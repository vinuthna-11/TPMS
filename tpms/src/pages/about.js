import React from "react";
import "../components/about.css";
import tsImage from "../images/ts.png";
import babuImage from "../images/mahesh-babu.png";
import dancerImage from "../images/dancer.png";
import harshiImage from "../images/harshi.png";
import roshiImage from "../images/roshi.png";
import vinuImage from "../images/vinu.png";
import hrishiImage from "../images/hrishith.png";

const About = () => {
  // Testimonial data
  const testimonials = [
    {
      quote:
        "TPMS has completely changed the way I showcase my skills. Within weeks, I connected with companies that truly value creativity.",
      author: "Taylor Swift ",
      img: tsImage,
    },
    {
      quote:
        "As a job provider, TPMS made it easy for me to find talent quickly. The portfolios are structured and professional.",
      author: "Mahesh Babu",
      img: babuImage,
    },
    {
      quote:
        "I loved the event participation feature. It helped me network with professionals in my field and boosted my confidence.",
      author: "Lavanya",
      img: dancerImage,
    },
  ];

  // Team data
  const teamMembers = [
    {
      name: "Lakshmi Harshitha",
      role: "Team Lead",
      img: harshiImage,
    },
    {
      name: "Roshitha",
      role: "Frontend Lead",
      img: roshiImage,
    },
    {
      name: "Vinuthna",
      role: "Project planner",
      img: vinuImage,
    },
    {
      name: "Hrishith",
      role: "Backend Lead",
      img: hrishiImage,
    },
  ];

  return (
    <div className="tpms-about">
      {/* Hero Section */}
      <section className="about-hero">
        <h1>About Talent Portfolio Management System</h1>
        <p>
          Empowering creative professionals to showcase their work, connect with
          opportunities, and grow their careers through our innovative
          platform.
        </p>
        <div className="cta-buttons">
          <a href="/register" className="cta-button primary-button">
            Join Now
          </a>
          <a href="/about" className="cta-button secondary-button">
            Learn More
          </a>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="offer-section">
        <h2>What We Offer</h2>
        <div className="offer-grid">
          {[
            {
              icon: "📂",
              title: "Portfolio Builder",
              desc: "Create and manage your professional portfolio with ease",
            },
            {
              icon: "💼",
              title: "Job Matching",
              desc: "Find opportunities tailored to your skills",
            },
            {
              icon: "🌐",
              title: "Networking",
              desc: "Connect with professionals in your field",
            },
            {
              icon: "⭐",
              title: "Reputation",
              desc: "Build credibility with ratings and reviews",
            },
            {
              icon: "🔒",
              title: "Security",
              desc: "Your data is protected with enterprise-grade security",
            },
            {
              icon: "📈",
              title: "Analytics",
              desc: "Track profile views and engagement metrics",
            },
          ].map((item, index) => (
            <div className="offer-card" key={index}>
              <div className="offer-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <h2>What People Say</h2>
        {testimonials.map((testimonial, index) => (
          <div
            className={`testimonial ${index % 2 ? "reverse" : ""}`}
            key={index}
          >
            <img src={testimonial.img} alt={testimonial.author} />
            <div className="testimonial-text">
              <p>"{testimonial.quote}"</p>
              <h4>- {testimonial.author}</h4>
            </div>
          </div>
        ))}
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2>Our Team</h2>
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div className="team-card" key={index}>
              <div className="team-avatar">
                <img src={member.img} alt={member.name} />
              </div>
              <h3>{member.name}</h3>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default About;
