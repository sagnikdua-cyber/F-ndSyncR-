# F!ndSyncR Term-I Demo Script

**Target Duration:** 5-10 Minutes
**Scenario:** A student (Alex) loses their blue water bottle. A finder (or admin acting as the hardware intake) finds it and registers it into the system. The system automatically matches, verifies, and confirms ownership.

## Part 1: Introduction (1 min)
- **Action:** Open `https://f-nd-sync-r.vercel.app`
- **Script:** "Welcome to F!ndSyncR. This is our intelligent lost and found system. Notice the intro animation, which guides the user into the experience. We'll skip to the login."

## Part 2: The Student Reports a Loss (2 min)
- **Action:** Log in as the student using an enrollment number and email OTP.
- **Script:** "F!ndSyncR uses passwordless OTP authentication tied to the student's college enrollment number. Once logged in, we reach the Student Dashboard."
- **Action:** Navigate to **Report Lost Item**.
- **Script:** "I've lost a blue Hydroflask water bottle. I'll enter the public characteristics (Blue, Hydroflask). Crucially, I will also enter a **Private Characteristic**—for example, 'A deep scratch on the bottom'. I submit the report. The system records this, but keeps the private characteristic completely hidden from the public."

## Part 3: Found Item Intake (Admin/Hardware Simulation) (2 min)
- **Action:** Open a new incognito window and log in using an Admin enrollment number.
- **Script:** "Now, imagine the bottle is found. In Term-II, a student would place it in the physical F!ndSyncR Box, which takes a picture. Today, as an Admin, I'll simulate this intake process."
- **Action:** Navigate to the `/found-item` route and upload an image of a blue Hydroflask.
- **Script:** "I upload the image. Google Gemini AI analyzes the image, automatically extracting the public characteristics like color and brand. Our matching algorithm then scans the database and finds a high-confidence match with the report we just filed."

## Part 4: Secure Claim & Verification (3 min)
- **Action:** Switch back to the Student window and open the registered Email inbox.
- **Script:** "The highest-ranking candidate—our student—receives an automated email notifying them of a potential match, containing a secure, single-use claim link."
- **Action:** Click the link in the email.
- **Script:** "The student reviews the found item. If they click 'NO', the system automatically moves to the next candidate. We will click 'YES, THIS IS MINE'."
- **Action:** Click 'YES'. The verification question appears.
- **Script:** "The system now challenges the student. It asks for the private characteristic they provided earlier. Let's enter: 'It has a deep scratch on the bottom.' Gemini AI evaluates this answer against the hidden database record to prevent fraud."
- **Action:** Submit the correct answer. The OTP screen appears.
- **Script:** "The AI confirms the answer is correct. Finally, to ensure the person clicking the link is the actual student, an OTP is sent to their email."
- **Action:** Enter the OTP.
- **Script:** "Success! Ownership is confirmed."

## Part 5: Recovery & Hardware Handoff (1 min)
- **Action:** Navigate to the **Recovery Status** page.
- **Script:** "The item now enters a 48-hour physical collection window. In Term-II, the student will take their ID and this reference code to the physical F!ndSyncR Box to trigger the electronic lock and collect their bottle. The software architecture for this hardware handoff is fully completed and operational in Term-I."

## Part 6: Admin Dashboard (1 min)
- **Action:** Switch back to the Admin window and navigate to `/admin`.
- **Script:** "Finally, the Admin Dashboard provides complete oversight of the system: total items, active claims, successful recoveries, and items that have expired past 7 days and require physical removal from the box."
- **Conclusion:** "That concludes the Term-I software demonstration. F!ndSyncR is fully secure, automated, and ready for hardware integration."
