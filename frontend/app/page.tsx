"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  useEffect(() => {
    const header = document.getElementById('siteHeader');
    const onScroll = () => {
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 40);
      }
    };
    window.addEventListener('scroll', onScroll);

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    const counters = document.querySelectorAll<HTMLElement>('[data-count]');
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = parseInt(el.dataset.count || '0', 10);
        const divide = parseFloat(el.dataset.divide || '1');
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const dur = 1500;
        const start = performance.now();
        function tick(now: number) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const value = (eased * target) / divide;
          el.textContent = prefix + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => countIO.observe(c));

    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
      countIO.disconnect();
    };
  }, []);

  return (
    <div id="sanchar-landing">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        
        #sanchar-landing {
          --blue-dark: #2f6fed;
          --green-dark: #149a52;
          --ink: #0d1130;
          --ink-muted: #5b6480;
          --line-light: #e8ebf3;
          --surface-2: #f5f8fb;
          
          font-family: 'Inter', sans-serif;
          background: #ffffff;
          color: var(--ink);
          overflow-x: hidden;
          width: 100vw;
          min-height: 100vh;
        }

        #sanchar-landing * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        #sanchar-landing h1, #sanchar-landing h2, #sanchar-landing h3, #sanchar-landing h4 {
          font-family: 'Space Grotesk', sans-serif;
        }

        #sanchar-landing a {
          color: inherit;
          text-decoration: none;
        }

        #sanchar-landing .ic svg, #sanchar-landing .icn svg, #sanchar-landing .micn svg, #sanchar-landing .glyph svg, #sanchar-landing .ck svg, #sanchar-landing .shield svg {
          width: 60%;
          height: 60%;
        }

        #sanchar-landing .ck svg {
          width: 70%;
          height: 70%;
        }

        #sanchar-landing .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1);
        }

        #sanchar-landing .reveal.in {
          opacity: 1;
          transform: translateY(0);
        }

        /* ================= NAV ================= */
        #sanchar-landing header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 48px;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid transparent;
          transition: background .35s ease, border-color .35s ease;
        }

        #sanchar-landing header.scrolled {
          background: rgba(255,255,255,0.92);
          border-color: var(--line-light);
          box-shadow: 0 1px 0 rgba(20,30,60,0.03);
        }

        #sanchar-landing .brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        #sanchar-landing .logo-badge {
          width: 36px;
          height: 36px;
          flex: none;
        }

        #sanchar-landing .logo-badge svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 8px rgba(20,154,82,0.25));
        }

        #sanchar-landing .brand-row h1 {
          font-size: 17px;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.1;
        }

        #sanchar-landing .brand-row h1 .ai {
          background: linear-gradient(100deg, var(--blue-dark), var(--green-dark));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        #sanchar-landing .brand-row .htag {
          font-size: 9.5px;
          letter-spacing: .16em;
          color: var(--ink-muted);
          font-weight: 700;
          margin-top: 2px;
        }

        #sanchar-landing nav.links {
          display: flex;
          gap: 32px;
          font-size: 14px;
          color: var(--ink-muted);
        }

        #sanchar-landing nav.links a {
          position: relative;
          padding: 4px 0;
        }

        #sanchar-landing nav.links a::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 0;
          height: 1px;
          background: var(--green-dark);
          transition: width .3s ease;
        }

        #sanchar-landing nav.links a:hover {
          color: var(--ink);
        }

        #sanchar-landing nav.links a:hover::after {
          width: 100%;
        }

        #sanchar-landing .nav-cta {
          display: flex;
          gap: 12px;
        }

        #sanchar-landing .btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--line-light);
          transition: border-color .25s ease, background .25s ease;
          will-change: transform;
        }

        #sanchar-landing .btn-ghost {
          color: var(--ink);
          background: var(--surface-2);
        }

        #sanchar-landing .btn-ghost:hover {
          background: #eef1f8;
        }

        #sanchar-landing .btn-solid {
          color: #fff;
          border: none;
          font-weight: 700;
          background: linear-gradient(100deg, var(--blue-dark), var(--green-dark));
          box-shadow: 0 12px 26px rgba(20,110,90,0.28);
        }

        #sanchar-landing .btn-solid:hover {
          box-shadow: 0 16px 32px rgba(20,110,90,0.38);
        }

        #sanchar-landing .btn-outline {
          border: 1px solid #cfd6e8;
          color: var(--ink);
          background: #fff;
        }

        #sanchar-landing .btn-outline:hover {
          border-color: var(--blue-dark);
          color: var(--blue-dark);
        }

        /* ================= HERO ================= */
        #sanchar-landing .hero {
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          padding: 130px 48px 0;
          color: var(--ink);
          background: radial-gradient(1100px 700px at 12% -10%, rgba(20,154,82,0.08), transparent 60%),
                     radial-gradient(900px 650px at 100% 15%, rgba(47,111,237,0.08), transparent 55%),
                     #ffffff;
          display: flex;
          flex-direction: column;
        }

        #sanchar-landing .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: .35;
          z-index: 0;
          animation: blobdrift 14s ease-in-out infinite;
        }

        #sanchar-landing .blob-a {
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(20,154,82,0.35), transparent 70%);
          top: -120px;
          left: 6%;
        }

        #sanchar-landing .blob-b {
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(47,111,237,0.32), transparent 70%);
          top: 60px;
          right: 4%;
          animation-delay: -7s;
        }

        @keyframes blobdrift {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(24px,-26px); }
        }

        #sanchar-landing .hero-copy {
          position: relative;
          z-index: 3;
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
          margin-bottom: 8px;
        }

        #sanchar-landing .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 9px 20px 9px 10px;
          border-radius: 999px;
          background: var(--surface-2);
          border: 1px solid var(--line-light);
          font-size: 13.5px;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 26px;
          letter-spacing: .02em;
        }

        #sanchar-landing .eyebrow .tagline-grad {
          background: linear-gradient(100deg, var(--blue-dark), var(--green-dark));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        #sanchar-landing .pulse-dot {
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green-dark);
        }

        #sanchar-landing .pulse-dot::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid var(--green-dark);
          animation: radar 1.8s ease-out infinite;
        }

        @keyframes radar {
          0% { transform: scale(.4); opacity: 1; }
          100% { transform: scale(2.6); opacity: 0; }
        }

        #sanchar-landing .hero-copy h2 {
          font-size: 52px;
          line-height: 1.14;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin-bottom: 18px;
          color: var(--ink);
        }

        #sanchar-landing .hero-copy h2 .grad {
          background: linear-gradient(100deg, var(--blue-dark), var(--green-dark) 65%, #1fae6a);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shine 7s linear infinite;
        }

        @keyframes shine {
          to { background-position: 200% center; }
        }

        #sanchar-landing .hero-copy p {
          font-size: 16px;
          color: var(--ink-muted);
          line-height: 1.7;
          max-width: 560px;
          margin: 0 auto 30px;
        }

        #sanchar-landing .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 40px;
        }

        #sanchar-landing .chip-row {
          position: relative;
          z-index: 3;
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        #sanchar-landing .chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          background: #fff;
          border: 1px solid var(--line-light);
          border-radius: 14px;
          padding: 14px 18px;
          width: 118px;
          box-shadow: 0 1px 3px rgba(20,30,60,0.04);
          transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
        }

        #sanchar-landing .chip:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 28px rgba(20,60,120,0.1);
          border-color: var(--line-light);
        }

        #sanchar-landing .chip .ic {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(47,111,237,0.1), rgba(20,154,82,0.14));
          color: var(--blue-dark);
        }

        #sanchar-landing .chip span {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.3;
        }

        #sanchar-landing .scene {
          position: relative;
          flex: 1;
          min-height: 300px;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        #sanchar-landing .fcard {
          position: absolute;
          background: #fff;
          border: 1px solid var(--line-light);
          border-radius: 14px;
          padding: 14px 16px;
          box-shadow: 0 20px 44px rgba(20,40,80,0.12);
          animation: drift 6s ease-in-out infinite;
        }

        @keyframes drift {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        #sanchar-landing .fcard .lbl {
          font-size: 11px;
          color: var(--ink-muted);
          margin-bottom: 6px;
        }

        #sanchar-landing .fcard .val {
          font-size: 20px;
          font-weight: 700;
          font-family: 'Space Grotesk';
          color: var(--ink);
        }

        #sanchar-landing .fcard .up {
          color: var(--green-dark);
          font-size: 11.5px;
          font-weight: 600;
          margin-left: 6px;
        }

        #sanchar-landing .card-ship {
          top: 0;
          right: 6%;
          width: 170px;
        }

        #sanchar-landing .card-otd {
          top: 150px;
          right: 0;
          width: 150px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation-delay: .6s;
        }

        #sanchar-landing .card-cost {
          bottom: 60px;
          left: 2%;
          width: 160px;
          animation-delay: 1.2s;
        }

        #sanchar-landing .spark {
          width: 100%;
          height: 32px;
          margin-top: 6px;
        }

        #sanchar-landing .spark path {
          fill: none;
          stroke: url(#sparkGrad);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawline 2s ease forwards .4s;
        }

        @keyframes drawline {
          to { stroke-dashoffset: 0; }
        }

        #sanchar-landing .ring-wrap {
          position: relative;
          width: 52px;
          height: 52px;
          flex: none;
        }

        #sanchar-landing .ring-wrap svg {
          transform: rotate(-90deg);
        }

        #sanchar-landing .ring-bg {
          fill: none;
          stroke: #e8ebf3;
          stroke-width: 6;
        }

        #sanchar-landing .ring-fg {
          fill: none;
          stroke: url(#ringGrad);
          stroke-width: 6;
          stroke-linecap: round;
          stroke-dasharray: 150.8;
          stroke-dashoffset: 150.8;
          animation: ringfill 1.8s ease forwards .5s;
        }

        @keyframes ringfill {
          to { stroke-dashoffset: 5; }
        }

        #sanchar-landing .bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 30px;
          margin-top: 8px;
        }

        #sanchar-landing .bars i {
          display: block;
          width: 6px;
          border-radius: 3px;
          background: linear-gradient(180deg, var(--green-dark), var(--blue-dark));
          transform: scaleY(0);
          transform-origin: bottom;
          animation: growbar .7s ease forwards;
        }

        @keyframes growbar {
          to { transform: scaleY(1); }
        }

        #sanchar-landing #mapSvg {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 50px;
          width: 100%;
          height: auto;
          z-index: 1;
        }

        #sanchar-landing .pin-pulse {
          animation: pinpulse 2.2s ease-out infinite;
        }

        @keyframes pinpulse {
          0% { r: 3; opacity: 1; }
          100% { r: 16; opacity: 0; }
        }

        #sanchar-landing .route-path {
          fill: none;
          stroke: url(#routeGrad);
          stroke-width: 2;
          stroke-dasharray: 6 8;
          animation: flow 1.4s linear infinite;
        }

        @keyframes flow {
          to { stroke-dashoffset: -28; }
        }

        #sanchar-landing .road-wrap {
          position: relative;
          z-index: 2;
          height: 110px;
          margin-top: auto;
        }

        #sanchar-landing .road-floor {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent, rgba(47,111,237,0.05));
          border-top: 1px solid var(--line-light);
        }

        #sanchar-landing .road-line {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: repeating-linear-gradient(90deg, rgba(20,30,60,0.18) 0 24px, transparent 24px 48px);
        }

        #sanchar-landing .truck-wrap {
          position: absolute;
          bottom: 12px;
          left: -260px;
          animation: drive 9s linear infinite;
        }

        @keyframes drive {
          from { left: -260px; }
          to { left: 104%; }
        }

        #sanchar-landing .truck-wrap svg {
          width: 210px;
          height: auto;
          filter: drop-shadow(0 10px 18px rgba(20,30,60,0.18));
        }

        #sanchar-landing .headlight {
          animation: beam 1.4s ease-in-out infinite;
        }

        @keyframes beam {
          0%,100% { opacity: .55; }
          50% { opacity: 1; }
        }

        #sanchar-landing .wheel {
          animation: spinwheel .5s linear infinite;
          transform-origin: center;
        }

        @keyframes spinwheel {
          to { transform: rotate(360deg); }
        }

        #sanchar-landing .drone-wrap {
          position: absolute;
          top: 60px;
          left: 52%;
          animation: hoverfly 5s ease-in-out infinite;
        }

        @keyframes hoverfly {
          0%,100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-18px) translateX(14px); }
        }

        #sanchar-landing .prop {
          animation: propspin .12s linear infinite;
          transform-origin: center;
        }

        @keyframes propspin {
          to { transform: rotate(360deg); }
        }

        #sanchar-landing .foot-row {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 22px;
          margin: 20px auto 40px;
          border: 1px solid var(--line-light);
          border-radius: 14px;
          background: var(--surface-2);
          flex-wrap: wrap;
          max-width: 1200px;
        }

        #sanchar-landing .sec-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12.5px;
          color: var(--ink-muted);
          max-width: 300px;
        }

        #sanchar-landing .sec-badge .shield {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(20,154,82,0.12);
          color: var(--green-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          flex: none;
        }

        #sanchar-landing .sec-badge b {
          color: var(--ink);
          display: block;
          font-size: 13px;
          margin-bottom: 2px;
        }

        #sanchar-landing .brands {
          display: flex;
          align-items: center;
          gap: 22px;
          flex-wrap: wrap;
        }

        #sanchar-landing .brands .tby {
          font-size: 10px;
          letter-spacing: .14em;
          color: var(--ink-muted);
          font-weight: 700;
          margin-right: 6px;
        }

        #sanchar-landing .brands span {
          font-size: 13px;
          font-weight: 700;
          color: #5b6486;
        }

        /* ================= MARQUEE ================= */
        #sanchar-landing .marquee-wrap {
          border-top: 1px solid var(--line-light);
          border-bottom: 1px solid var(--line-light);
          padding: 20px 0;
          overflow: hidden;
          background: var(--surface-2);
        }

        #sanchar-landing .marquee-track {
          display: flex;
          gap: 56px;
          white-space: nowrap;
          width: max-content;
          animation: scroll-left 26s linear infinite;
        }

        #sanchar-landing .marquee-track span {
          font-size: 13px;
          color: var(--ink-muted);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        #sanchar-landing .marquee-track span::before {
          content: '◆';
          color: var(--green-dark);
          font-size: 8px;
        }

        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ================= SECTIONS ================= */
        #sanchar-landing section {
          padding: 110px 48px;
        }

        #sanchar-landing .wrap {
          max-width: 1280px;
          margin: 0 auto;
        }

        #sanchar-landing .section-head {
          max-width: 640px;
          margin-bottom: 54px;
        }

        #sanchar-landing .section-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .1em;
          color: var(--green-dark);
          margin-bottom: 16px;
          font-family: 'JetBrains Mono';
        }

        #sanchar-landing .section-tag::before {
          content: '';
          width: 16px;
          height: 1px;
          background: var(--green-dark);
          display: inline-block;
        }

        #sanchar-landing .section-head h2 {
          font-size: 34px;
          font-weight: 600;
          line-height: 1.22;
          margin-bottom: 14px;
          color: var(--ink);
        }

        #sanchar-landing .section-head p {
          color: var(--ink-muted);
          font-size: 15px;
          line-height: 1.7;
        }

        #sanchar-landing .pillars {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 1px;
          background: var(--line-light);
          border: 1px solid var(--line-light);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(20,30,60,0.04);
        }

        #sanchar-landing .pillar {
          background: #fff;
          padding: 34px 30px;
          transition: background .3s ease, transform .3s ease, box-shadow .3s ease;
        }

        #sanchar-landing .pillar:hover {
          background: var(--surface-2);
          transform: translateY(-4px);
          box-shadow: 0 16px 34px rgba(20,60,120,0.08);
        }

        #sanchar-landing .pillar .idx {
          font-family: 'JetBrains Mono';
          font-size: 12px;
          color: #b0b6d1;
          margin-bottom: 20px;
          display: block;
        }

        #sanchar-landing .pillar .icn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: linear-gradient(135deg, rgba(59,109,251,0.1), rgba(20,154,82,0.12));
          border: 1px solid var(--line-light);
          color: var(--blue-dark);
        }

        #sanchar-landing .pillar h3 {
          font-size: 17px;
          font-weight: 600;
          margin-bottom: 9px;
          color: var(--ink);
        }

        #sanchar-landing .pillar p {
          font-size: 13.5px;
          color: var(--ink-muted);
          line-height: 1.7;
          margin-bottom: 16px;
        }

        #sanchar-landing .mini-chart {
          width: 100%;
          height: 34px;
          display: block;
          margin-bottom: 10px;
        }

        #sanchar-landing .mini-chart .mline {
          fill: none;
          stroke: url(#miniGrad);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          transition: stroke-dashoffset 1.4s ease;
        }

        #sanchar-landing .pillars.in .mini-chart .mline {
          stroke-dashoffset: 0;
        }

        #sanchar-landing .mini-bars {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          height: 34px;
          margin-bottom: 10px;
        }

        #sanchar-landing .mini-bars i {
          display: block;
          flex: 1;
          border-radius: 3px;
          background: linear-gradient(180deg, var(--green-dark), var(--blue-dark));
          transform: scaleY(0);
          transform-origin: bottom;
          transition: transform .6s ease;
        }

        #sanchar-landing .pillars.in .mini-bars i {
          transform: scaleY(1);
        }

        #sanchar-landing .mini-ring {
          width: 34px;
          height: 34px;
          margin-bottom: 10px;
        }

        #sanchar-landing .mini-ring svg {
          transform: rotate(-90deg);
        }

        #sanchar-landing .mini-ring-bg {
          fill: none;
          stroke: #e8ebf3;
          stroke-width: 5;
        }

        #sanchar-landing .mini-ring-fg {
          fill: none;
          stroke: url(#miniGrad);
          stroke-width: 5;
          stroke-linecap: round;
          stroke-dasharray: 88;
          stroke-dashoffset: 88;
          transition: stroke-dashoffset 1.4s ease;
        }

        #sanchar-landing .pillars.in .mini-ring-fg {
          stroke-dashoffset: 1;
        }

        #sanchar-landing .pillar-stat {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
          font-family: 'Space Grotesk';
        }

        #sanchar-landing .pillar-stat span {
          color: var(--green-dark);
        }

        #sanchar-landing .modules-grid-outer {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 64px;
          align-items: start;
        }

        #sanchar-landing .modules-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        #sanchar-landing .mcard {
          border: 1px solid var(--line-light);
          border-radius: 16px;
          padding: 24px;
          background: #fff;
          position: relative;
          overflow: hidden;
          transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
        }

        #sanchar-landing .mcard:hover {
          transform: translateY(-6px);
          border-color: var(--line-light);
          box-shadow: 0 20px 40px rgba(20,60,120,0.1);
        }

        #sanchar-landing .mcard::after {
          content: '';
          position: absolute;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          top: -65px;
          right: -65px;
          background: radial-gradient(circle, rgba(20,154,82,0.12), transparent 70%);
          opacity: 0;
          transition: opacity .35s ease;
        }

        #sanchar-landing .mcard:hover::after {
          opacity: 1;
        }

        #sanchar-landing .mcard .micn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(59,109,251,0.1), rgba(20,154,82,0.12));
          border: 1px solid var(--line-light);
          color: var(--blue-dark);
          font-size: 16px;
          margin-bottom: 14px;
        }

        #sanchar-landing .mcard h4 {
          font-size: 15.5px;
          font-weight: 600;
          margin-bottom: 7px;
          color: var(--ink);
        }

        #sanchar-landing .mcard p {
          font-size: 13px;
          color: var(--ink-muted);
          line-height: 1.65;
          margin-bottom: 14px;
        }

        #sanchar-landing .mcard-chart {
          width: 100%;
          height: 44px;
          display: block;
          margin-bottom: 10px;
          position: relative;
          z-index: 2;
        }

        #sanchar-landing .mcard-chart .mline2 {
          fill: none;
          stroke: url(#miniGrad);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-dasharray: 260;
          stroke-dashoffset: 260;
          transition: stroke-dashoffset 1.6s ease;
        }

        #sanchar-landing .modules-cards.in .mline2 {
          stroke-dashoffset: 0;
        }

        #sanchar-landing .mcard-route {
          fill: none;
          stroke: url(#miniGrad);
          stroke-width: 2;
          stroke-dasharray: 5 6;
          animation: mcflow 1.2s linear infinite;
        }

        @keyframes mcflow {
          to { stroke-dashoffset: -22; }
        }

        #sanchar-landing .mcard-gauge-bg {
          fill: none;
          stroke: #e8ebf3;
          stroke-width: 6;
        }

        #sanchar-landing .mcard-gauge-fg {
          fill: none;
          stroke: url(#miniGrad);
          stroke-width: 6;
          stroke-linecap: round;
          stroke-dasharray: 69;
          stroke-dashoffset: 69;
          transition: stroke-dashoffset 1.6s ease;
        }

        #sanchar-landing .modules-cards.in .mcard-gauge-fg {
          stroke-dashoffset: 4;
        }

        #sanchar-landing .mcard-progress {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 2px;
        }

        #sanchar-landing .mcard-progress .track {
          height: 6px;
          border-radius: 4px;
          background: #eef1f8;
          overflow: hidden;
        }

        #sanchar-landing .mcard-progress .fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--blue-dark), var(--green-dark));
          width: 0;
          transition: width 1.4s ease;
        }

        #sanchar-landing .modules-cards.in .mcard-progress .fill {
          width: var(--w);
        }

        #sanchar-landing .mcard-stat {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--ink);
          font-family: 'Space Grotesk';
        }

        #sanchar-landing .mcard-stat span {
          color: var(--green-dark);
        }

        #sanchar-landing .split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        #sanchar-landing .panel-card {
          background: #fff;
          border: 1px solid var(--line-light);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(20,30,60,0.04);
        }

        #sanchar-landing .panel-card h2 {
          color: var(--ink);
        }

        #sanchar-landing .checklist {
          list-style: none;
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        #sanchar-landing .checklist li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--surface-2);
          border: 1px solid transparent;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--ink);
          transition: transform .25s ease, border-color .25s ease, background .25s ease;
        }

        #sanchar-landing .checklist li:hover {
          transform: translateX(8px);
          border-color: var(--line-light);
          background: #eef3fb;
        }

        #sanchar-landing .checklist li .ck {
          width: 19px;
          height: 19px;
          border-radius: 50%;
          flex: none;
          font-size: 10.5px;
          background: linear-gradient(135deg, var(--blue-dark), var(--green-dark));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #sanchar-landing .steps {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        #sanchar-landing .step {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 15px 18px;
          background: var(--surface-2);
          border: 1px solid transparent;
          border-radius: 12px;
          transition: transform .25s ease, background .25s ease, border-color .25s ease;
        }

        #sanchar-landing .step:hover {
          transform: translateX(8px);
          background: #eef3fb;
          border-color: var(--line-light);
        }

        #sanchar-landing .step .n {
          width: 28px;
          height: 28px;
          border-radius: 9px;
          flex: none;
          font-size: 12.5px;
          font-weight: 700;
          background: #fff;
          border: 1px solid var(--line-light);
          color: var(--blue-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono';
        }

        #sanchar-landing .step .s {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--ink);
        }

        #sanchar-landing .final {
          text-align: center;
          border-radius: 28px;
          margin: 0 48px 110px;
          padding: 88px 40px;
          background: radial-gradient(700px 340px at 50% 0%, rgba(20,154,82,0.08), transparent 65%), var(--surface-2);
          border: 1px solid var(--line-light);
          position: relative;
          overflow: hidden;
        }

        #sanchar-landing .final .radar-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 880px;
          height: 880px;
          transform: translate(-50%,-50%);
          border-radius: 50%;
          border: 1px solid var(--line-light);
          opacity: .6;
        }

        #sanchar-landing .final .radar-bg::before, #sanchar-landing .final .radar-bg::after {
          content: '';
          position: absolute;
          inset: 118px;
          border-radius: 50%;
          border: 1px solid var(--line-light);
        }

        #sanchar-landing .final .radar-bg::after {
          inset: 256px;
        }

        #sanchar-landing .final .glyph {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          margin: 0 auto 24px;
          position: relative;
          z-index: 2;
          background: linear-gradient(135deg, var(--blue-dark), var(--green-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          color: #fff;
          animation: pulsering 2.6s ease-in-out infinite;
        }

        @keyframes pulsering {
          0%,100% { box-shadow: 0 0 0 0 rgba(20,154,82,0.35); }
          50% { box-shadow: 0 0 0 20px rgba(20,154,82,0); }
        }

        #sanchar-landing .final h2 {
          font-size: 34px;
          margin-bottom: 14px;
          position: relative;
          z-index: 2;
          color: var(--ink);
        }

        #sanchar-landing .final p {
          color: var(--ink-muted);
          font-size: 15px;
          max-width: 580px;
          margin: 0 auto 32px;
          line-height: 1.7;
          position: relative;
          z-index: 2;
        }

        #sanchar-landing .final .actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        #sanchar-landing .final .btn-outline {
          border: 1px solid #cfd6e8;
          color: var(--ink);
          background: #fff;
        }

        #sanchar-landing .final .btn-outline:hover {
          border-color: var(--blue-dark);
          color: var(--blue-dark);
        }

        #sanchar-landing .stats-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 1px;
          background: var(--line-light);
          border: 1px solid var(--line-light);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(20,30,60,0.04);
        }

        #sanchar-landing .stat-box {
          background: #fff;
          padding: 38px 30px;
          text-align: center;
          transition: background .3s ease, transform .3s ease;
        }

        #sanchar-landing .stat-box:hover {
          background: var(--surface-2);
          transform: translateY(-4px);
        }

        #sanchar-landing .stat-box .snum {
          font-size: 38px;
          font-weight: 700;
          font-family: 'Space Grotesk';
          margin-bottom: 8px;
        }

        #sanchar-landing .stat-box .snum .grad2 {
          background: linear-gradient(100deg, var(--blue-dark), var(--green-dark));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        #sanchar-landing .stat-box .slbl {
          font-size: 13px;
          color: var(--ink-muted);
          line-height: 1.5;
        }

        #sanchar-landing footer {
          padding: 36px 48px;
          text-align: center;
          color: var(--ink-muted);
          font-size: 13px;
          border-top: 1px solid var(--line-light);
          background: #fff;
        }

        @media (max-width:960px) {
          #sanchar-landing .modules-grid-outer, #sanchar-landing .split { grid-template-columns: 1fr; }
          #sanchar-landing .pillars, #sanchar-landing .stats-grid { grid-template-columns: 1fr 1fr; }
          #sanchar-landing .modules-cards { grid-template-columns: 1fr; }
          #sanchar-landing header { padding: 16px 20px; }
          #sanchar-landing nav.links { display: none; }
          #sanchar-landing section { padding: 70px 20px; }
          #sanchar-landing .hero-copy h2 { font-size: 34px; }
          #sanchar-landing .final { margin: 0 20px 70px; }
          #sanchar-landing .scene { min-height: 520px; }
          #sanchar-landing .card-ship, #sanchar-landing .card-otd, #sanchar-landing .card-cost { position: static; margin: 10px auto; width: 220px !important; }
        }
      `}} />

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="miniGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2f6fed" /><stop offset="100%" stopColor="#149a52" />
          </linearGradient>
        </defs>
      </svg>

      <header id="siteHeader">
        <div className="brand-row">
          <div className="logo-badge" style={{ display: 'flex', alignItems: 'center' }}>
            <Image src="/logo.png" alt="Sanchar AI Logo" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1>Sanchar<span className="ai">AI</span><div className="htag">INTELLIGENCE INTO MOTION</div></h1>
        </div>
        <nav className="links">
          <a href="#platform">Platform</a>
          <a href="#coverage">Coverage</a>
          <a href="#workflow">Workflow</a>
        </nav>
        <div className="nav-cta">
          <Link href="/auth/login" className="btn btn-ghost"><span>Sign in</span></Link>
          <Link href="/auth/signup" className="btn btn-solid"><span>Get started &rarr;</span></Link>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="blob blob-a"></div>
        <div className="blob blob-b"></div>

        <div className="hero-copy reveal in">
          <div className="eyebrow"><span className="pulse-dot"></span> <span className="tagline-grad">Intelligence into motion</span></div>
          <h2>AI-powered logistics. <span className="grad">Intelligence that never stops moving.</span></h2>
          <p>Sanchar AI optimizes your logistics operations with real-time insights, predictive intelligence, and autonomous decisions across every route you run.</p>
          <div className="hero-actions">
            <Link href="/auth/signup" className="btn btn-solid"><span>Get started free &rarr;</span></Link>
            <a href="#platform" className="btn btn-outline"><span>Watch demo</span></a>
          </div>
        </div>

        <div className="chip-row">
          <div className="chip"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 1 1-5.66 5.66L4 17l3 3 5.04-5.04a4 4 0 0 1 5.66-5.66z" /><path d="M14 5l2-2 3 3-2 2" /></svg></div><span>Predictive Maintenance</span></div>
          <div className="chip"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="7" width="13" height="9" rx="1" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="6" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg></div><span>Fleet Monitoring</span></div>
          <div className="chip"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M5 8c0 5 14 3 14 8" strokeDasharray="2.2 3.2" /></svg></div><span>Route Optimization</span></div>
          <div className="chip"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.2" /></svg></div><span>Live Shipment Tracking</span></div>
          <div className="chip"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></svg></div><span>AI Decision Engine</span></div>
        </div>

        <div className="scene">
          <div className="fcard card-ship">
            <div className="lbl">Live Shipments</div>
            <div className="val">1,248 <span className="up">&uarr; 12.6%</span></div>
            <svg className="spark" viewBox="0 0 140 32">
              <defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2f6fed" /><stop offset="100%" stopColor="#149a52" />
              </linearGradient></defs>
              <path d="M0 24 L20 20 L40 26 L60 12 L80 16 L100 6 L120 10 L140 2" />
            </svg>
          </div>

          <div className="fcard card-otd">
            <div className="ring-wrap">
              <svg viewBox="0 0 60 60" width="52" height="52">
                <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2f6fed" /><stop offset="100%" stopColor="#149a52" />
                </linearGradient></defs>
                <circle className="ring-bg" cx="30" cy="30" r="24" />
                <circle className="ring-fg" cx="30" cy="30" r="24" />
              </svg>
            </div>
            <div>
              <div className="lbl">On-Time Delivery</div>
              <div className="val" style={{ fontSize: '16px' }}>96.8% <span className="up" style={{ fontSize: '10.5px' }}>&uarr; 8.4%</span></div>
            </div>
          </div>

          <div className="fcard card-cost">
            <div className="lbl">Cost Saved <span className="up">&uarr; 15.3%</span></div>
            <div className="val">&#8377;2.45 Cr</div>
            <div className="bars">
              <i style={{ height: '40%', animationDelay: '.2s' }}></i>
              <i style={{ height: '65%', animationDelay: '.3s' }}></i>
              <i style={{ height: '50%', animationDelay: '.4s' }}></i>
              <i style={{ height: '85%', animationDelay: '.5s' }}></i>
              <i style={{ height: '70%', animationDelay: '.6s' }}></i>
              <i style={{ height: '100%', animationDelay: '.7s' }}></i>
            </div>
          </div>

          <svg id="mapSvg" viewBox="0 0 900 220" preserveAspectRatio="xMidYMax meet">
            <defs><linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2f6fed" /><stop offset="100%" stopColor="#149a52" />
            </linearGradient></defs>
            <path className="route-path" d="M120 150 C 260 60, 340 60, 430 110 S 640 170, 760 90" />
            <circle cx="120" cy="150" r="4" fill="#149a52" />
            <circle className="pin-pulse" cx="120" cy="150" r="3" fill="none" stroke="#149a52" strokeWidth="1.5" />
            <circle cx="430" cy="110" r="4" fill="#2f6fed" />
            <circle className="pin-pulse" cx="430" cy="110" r="3" fill="none" stroke="#2f6fed" strokeWidth="1.5" style={{ animationDelay: '.7s' }} />
            <circle cx="760" cy="90" r="4" fill="#149a52" />
            <circle className="pin-pulse" cx="760" cy="90" r="3" fill="none" stroke="#149a52" strokeWidth="1.5" style={{ animationDelay: '1.4s' }} />
          </svg>

          <div className="drone-wrap">
            <svg viewBox="0 0 80 50" width="70" height="44">
              <line x1="18" y1="18" x2="8" y2="8" stroke="#9fb3d9" strokeWidth="2" />
              <line x1="62" y1="18" x2="72" y2="8" stroke="#9fb3d9" strokeWidth="2" />
              <line x1="18" y1="32" x2="8" y2="42" stroke="#9fb3d9" strokeWidth="2" />
              <line x1="62" y1="32" x2="72" y2="42" stroke="#9fb3d9" strokeWidth="2" />
              <g className="prop"><circle cx="8" cy="8" r="9" fill="none" stroke="#2f6fed" strokeWidth="2" /></g>
              <g className="prop" style={{ animationDelay: '-.05s' }}><circle cx="72" cy="8" r="9" fill="none" stroke="#2f6fed" strokeWidth="2" /></g>
              <g className="prop" style={{ animationDelay: '-.02s' }}><circle cx="8" cy="42" r="9" fill="none" stroke="#2f6fed" strokeWidth="2" /></g>
              <g className="prop" style={{ animationDelay: '-.08s' }}><circle cx="72" cy="42" r="9" fill="none" stroke="#2f6fed" strokeWidth="2" /></g>
              <rect x="26" y="19" width="28" height="12" rx="4" fill="url(#logoGrad)" />
              <circle cx="40" cy="25" r="3" fill="#149a52" />
            </svg>
          </div>

          <div className="road-wrap">
            <div className="road-floor"></div>
            <div className="road-line"></div>
            <div className="truck-wrap">
              <svg viewBox="0 0 220 90">
                <rect x="0" y="30" width="70" height="38" rx="6" fill="#eef2fb" stroke="#c7cfe4" />
                <rect x="8" y="38" width="24" height="16" rx="2" fill="#2f6fed" opacity="0.35" />
                <circle className="headlight" cx="4" cy="58" r="4" fill="#f4b93d" />
                <rect x="72" y="14" width="140" height="54" rx="6" fill="#ffffff" stroke="#c7cfe4" />
                <rect x="80" y="22" width="124" height="16" rx="3" fill="#149a52" opacity="0.16" />
                <text x="90" y="55" fill="#2f6fed" fontSize="13" fontFamily="Space Grotesk" fontWeight="700">Sanchar AI</text>
                <g className="wheel"><circle cx="34" cy="70" r="12" fill="#2a3350" stroke="#c7cfe4" strokeWidth="3" /></g>
                <g className="wheel"><circle cx="150" cy="70" r="12" fill="#2a3350" stroke="#c7cfe4" strokeWidth="3" /></g>
                <g className="wheel"><circle cx="185" cy="70" r="12" fill="#2a3350" stroke="#c7cfe4" strokeWidth="3" /></g>
              </svg>
            </div>
          </div>
        </div>

        <div className="foot-row">
          <div className="sec-badge">
            <div className="shield"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg></div>
            <div><b>Enterprise Grade Security</b>Your data is protected with end-to-end encryption and AI threat detection.</div>
          </div>
          <div className="brands">
            <span className="tby">TRUSTED BY LOGISTICS LEADERS</span>
            <span>DHL</span><span>MAERSK</span><span>DELHIVERY</span><span>DP WORLD</span><span>BLUE DART</span>
          </div>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-track">
          <span>Route scoring</span><span>SLA breach prediction</span><span>Reverse logistics</span><span>Hub load balancing</span><span>Executive approvals</span><span>Cost discovery</span><span>Audit trails</span>
          <span>Route scoring</span><span>SLA breach prediction</span><span>Reverse logistics</span><span>Hub load balancing</span><span>Executive approvals</span><span>Cost discovery</span><span>Audit trails</span>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-tag">impact in numbers</div>
            <h2>Trusted at network scale.</h2>
            <p>Live figures pulled from the same command tower your team works in every day.</p>
          </div>
          <div className="stats-grid reveal">
            <div className="stat-box"><div className="snum"><span className="grad2" data-count="1800" data-suffix="+">0</span></div><div className="slbl">Transactions processed</div></div>
            <div className="stat-box"><div className="snum"><span className="grad2" data-count="968" data-decimals="1" data-divide="10" data-suffix="%">0</span></div><div class="slbl">On-time delivery rate</div></div>
            <div className="stat-box"><div className="snum"><span className="grad2" data-count="245" data-decimals="2" data-divide="100" data-prefix="₹" data-suffix=" Cr">0</span></div><div className="slbl">Logistics cost saved</div></div>
            <div className="stat-box"><div className="snum"><span className="grad2" data-count="18" data-suffix="+">0</span></div><div className="slbl">Command modules live</div></div>
          </div>
        </div>
      </section>

      <section id="platform">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-tag">core pillars</div>
            <h2>Three disciplines, one command surface.</h2>
            <p>Sanchar AI collapses network decisioning, daily operational UX, and production-grade foundations into a single workspace.</p>
          </div>
          <div className="pillars reveal">
            <div className="pillar">
              <span className="idx">01</span>
              <div className="icn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5z" /><path d="M3 13l9 5 9-5" /></svg></div>
              <h3>Network decisioning</h3>
              <p>Built around route optimization, cost reduction, SLA control, and logistics network analysis.</p>
              <svg className="mini-chart" viewBox="0 0 200 34"><path className="mline" d="M0 26 L30 20 L60 24 L90 12 L120 16 L150 6 L180 10 L200 2" /></svg>
              <div className="pillar-stat"><span data-count="18" data-suffix="%">0</span> faster route decisions</div>
            </div>
            <div className="pillar">
              <span className="idx">02</span>
              <div className="icn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.3" /><rect x="14" y="3" width="7" height="7" rx="1.3" /><rect x="3" y="14" width="7" height="7" rx="1.3" /><rect x="14" y="14" width="7" height="7" rx="1.3" /></svg></div>
              <h3>Operational UX</h3>
              <p>Designed for repeated daily use with dense dashboards, filters, maps, exports, and review flows.</p>
              <div className="mini-bars">
                <i style={{ height: '35%', transitionDelay: '.05s' }}></i>
                <i style={{ height: '55%', transitionDelay: '.1s' }}></i>
                <i style={{ height: '40%', transitionDelay: '.15s' }}></i>
                <i style={{ height: '75%', transitionDelay: '.2s' }}></i>
                <i style={{ height: '60%', transitionDelay: '.25s' }}></i>
                <i style={{ height: '90%', transitionDelay: '.3s' }}></i>
                <i style={{ height: '70%', transitionDelay: '.35s' }}></i>
              </div>
              <div className="pillar-stat"><span data-count="24">0</span>/7 live dashboard refresh</div>
            </div>
            <div className="pillar">
              <span className="idx">03</span>
              <div className="icn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg></div>
              <h3>Production foundation</h3>
              <p>Signup, login, reset password, protected routes, API checks, and governed source data.</p>
              <div className="mini-ring">
                <svg viewBox="0 0 34 34"><circle className="mini-ring-bg" cx="17" cy="17" r="14" /><circle className="mini-ring-fg" cx="17" cy="17" r="14" /></svg>
              </div>
              <div className="pillar-stat"><span data-count="999" data-divide="10" data-decimals="1" data-suffix="%">0</span> platform uptime</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="modules-grid-outer">
            <div className="reveal">
              <div className="section-tag">platform modules</div>
              <h2>Everything needed to move from data to decision.</h2>
              <p style={{ color: 'var(--ink-muted)', fontSize: '14.5px', lineHeight: '1.75', maxWidth: '400px' }}>The app is not just a landing page. It ships an operational workspace covering dashboards, maps, intelligence panels, reports, and approvals.</p>
            </div>
            <div className="modules-cards reveal">
              <div className="mcard">
                <div className="micn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 15a8 8 0 1 1 16 0" /><path d="M12 15l4-5" /></svg></div>
                <h4>Mission Control</h4>
                <p>Live KPI board for shipments, SLA breaches, tamper alerts, network health, and operational search.</p>
                <svg className="mcard-chart" viewBox="0 0 220 44"><path className="mline2" d="M0 34 L25 30 L50 36 L75 18 L100 24 L125 8 L150 14 L175 4 L200 10 L220 2" /></svg>
                <div className="mcard-stat"><span data-count="1248" data-suffix=" live">0</span> shipments tracked</div>
              </div>
              <div className="mcard">
                <div className="micn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M5 8c0 5 14 3 14 8" strokeDasharray="2.2 3.2" /></svg></div>
                <h4>Route Intelligence</h4>
                <p>Corridor scoring, hub load review, route comparison, and export-ready recommendations.</p>
                <svg className="mcard-chart" viewBox="0 0 220 44">
                  <circle cx="12" cy="34" r="4" fill="#149a52" />
                  <circle cx="208" cy="10" r="4" fill="#2f6fed" />
                  <path className="mcard-route" d="M12 34 C 70 40, 100 6, 208 10" />
                </svg>
                <div className="mcard-stat"><span data-count="32" data-suffix="%">0</span> faster route scoring</div>
              </div>
              <div className="mcard">
                <div className="micn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 1 1-5.66 5.66L4 17l3 3 5.04-5.04a4 4 0 0 1 5.66-5.66z" /><path d="M14 5l2-2 3 3-2 2" /></svg></div>
                <h4>Reverse Logistics</h4>
                <p>Repair-center capacity, smart swaps, inventory redeployment, and stockout prevention workflows.</p>
                <svg className="mcard-chart" viewBox="0 0 100 44" style={{ width: '60px', height: '44px' }}>
                  <path className="mcard-gauge-bg" d="M8 38 A 22 22 0 0 1 92 38" />
                  <path className="mcard-gauge-fg" d="M8 38 A 22 22 0 0 1 92 38" />
                </svg>
                <div className="mcard-stat"><span data-count="94" data-suffix="%">0</span> parts recovered</div>
              </div>
              <div className="mcard">
                <div className="micn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="1.5" /><path d="M9 3h6v3H9z" /><path d="M9 13l2 2 4-4" /></svg></div>
                <h4>Executive Governance</h4>
                <p>War-room approvals, reports, audit trails, and settings for production operations.</p>
                <div className="mcard-progress">
                  <div className="track"><div className="fill" style={{ '--w': '82%' } as React.CSSProperties}></div></div>
                  <div className="track"><div className="fill" style={{ '--w': '64%' } as React.CSSProperties}></div></div>
                  <div className="track"><div className="fill" style={{ '--w': '93%' } as React.CSSProperties}></div></div>
                </div>
                <div className="mcard-stat"><span data-count="128">0</span> approvals this week</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="coverage">
        <div className="wrap">
          <div className="split">
            <div className="panel-card reveal">
              <h2 style={{ fontSize: '26px' }}>Operational coverage</h2>
              <ul className="checklist">
                <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6" /></svg></span> Forward logistics route optimization</li>
                <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6" /></svg></span> Reverse logistics and repair center balancing</li>
                <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6" /></svg></span> SLA breach prediction and alerting</li>
                <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6" /></svg></span> Cost reduction through route discovery</li>
                <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6" /></svg></span> Dataset-backed analytics and executive reporting</li>
                <li><span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6" /></svg></span> Enterprise-grade authenticated production access</li>
              </ul>
            </div>

            <div className="panel-card reveal" id="workflow">
              <h2 style={{ fontSize: '26px' }}>Decision workflow</h2>
              <div className="steps">
                <div className="step"><span className="n">01</span><span className="s">Ingest logistics workbook</span></div>
                <div className="step"><span className="n">02</span><span className="s">Validate hubs, parts, TPRs, transactions</span></div>
                <div className="step"><span className="n">03</span><span className="s">Score route, SLA, cost, and repair risk</span></div>
                <div className="step"><span className="n">04</span><span className="s">Recommend reroutes and redeployments</span></div>
                <div className="step"><span className="n">05</span><span className="s">Approve, export, and monitor execution</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="final reveal">
        <div className="radar-bg"></div>
        <div className="glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg></div>
        <h2>Ready for the next review pass.</h2>
        <p>Explore dashboards, route intelligence, predictions, repairs, reports, and executive approvals &mdash; all inside one command tower.</p>
        <div className="actions">
          <Link href="/auth/signup" className="btn btn-solid"><span>Get started free &rarr;</span></Link>
          <a href="#platform" className="btn btn-outline"><span>Talk to sales</span></a>
        </div>
      </div>

      <footer>&copy; 2026 Sanchar AI &mdash; intelligence into motion, for the modern supply network.</footer>
    </div>
  )
}
