# Project Summary: F!ndSyncR

## Title
F!ndSyncR: An AI-Powered Intelligent Lost & Found System with Automated Ownership Verification

## Abstract
F!ndSyncR is a modern, full-stack web application designed to solve the chronic problem of unmanaged lost and found items on college campuses. By leveraging artificial intelligence for image analysis, secure role-based access control, and a rigorous private-ownership verification protocol, F!ndSyncR eliminates manual matching and prevents fraudulent claims. The Term-I software prototype successfully demonstrates a fully functional candidate-matching pipeline and ownership confirmation system, preparing the foundation for physical hardware integration in Term-II.

## Problem Statement
Traditional lost and found systems in institutions rely on manual ledgers, physical descriptions, and honor systems. This leads to slow recovery times, low return rates, privacy vulnerabilities, and the risk of items being claimed by malicious actors. There is a need for an automated, secure, and verifiable system that connects students who lost items with the items that have been found, without exposing sensitive characteristics publicly.

## Proposed Solution
F!ndSyncR provides a dual-sided digital platform. Students report lost items with both public (visible) and private (hidden) characteristics. When an item is found and uploaded by an authorized intake user, Google Gemini AI extracts its public characteristics. A matching algorithm then ranks potential candidates. Instead of simply handing the item over, F!ndSyncR sequentially contacts candidates, challenging them to answer a private verification question based on the hidden characteristics they initially provided, followed by an email OTP for identity confirmation.

## Objectives
- Automate the matching of lost items with found items using AI.
- Protect the identity and privacy of both the finder and the loser.
- Prevent fraudulent claims through zero-knowledge private characteristic verification.
- Provide a secure, seamless, and responsive user experience for college students.
- Build a robust API and backend infrastructure ready for physical hardware lock integration (F!ndSyncR Box).

## Methodology
The project follows an Agile development methodology, separated into two distinct terms. 
- **Term-I** focused on developing the complete software architecture, including authentication, database models, AI matching pipelines, and the frontend user interface.
- **Term-II** will focus on integrating the software with IoT hardware (Raspberry Pi, electronic locks, and QR scanners).

## Technologies Used
- **Frontend & API**: Next.js 14, React, Tailwind CSS, TypeScript
- **Database & Authentication**: Firebase Admin, Firebase Auth, Firestore
- **Storage**: Supabase Storage (for secure image hosting)
- **AI Integration**: Google Gemini AI (gemini-1.5-flash)
- **Email Service**: Resend
- **Deployment**: Vercel

## Major Features
- **Role-Based Access Control (RBAC)**: Distinct permissions for Students, Admins, and Intake systems.
- **Smart Candidate Pipeline**: AI-driven public characteristic extraction and automated scoring.
- **Sequential Claiming**: Automatically contacts the highest-scoring candidate, progressing down the list if declined or failed.
- **Secure Ownership Verification**: Requires answering a private question (verified by AI) and completing an OTP challenge.
- **Recovery Window Tracker**: Manages a 48-hour physical collection window, reverting items if uncollected.

## Expected Outcome
A fully operational, secure software platform that drastically reduces the administrative overhead of lost and found management while maximizing the successful recovery rate of lost items for students.

## Limitations
- AI matching accuracy is dependent on the quality of the uploaded found item images and the accuracy of the student's initial report.
- The system currently requires manual physical collection authorization (Term-I) until the hardware lock is implemented (Term-II).

## Future Scope (Term-II)
- Integration with a Raspberry Pi-powered physical drop-box.
- Automated door unlocking via system-generated, time-limited collection authorizations.
- Hardware-side QR scanning for immediate item intake and release.
