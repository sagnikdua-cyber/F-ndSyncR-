# F!ndSyncR Term-I Viva Q&A Guide

### Why did you choose this project? / What problem does it solve?
Lost and found systems on college campuses are highly inefficient. They rely on manual ledgers and honor systems, leading to low recovery rates, administrative burden, and a high risk of fraudulent claims. We chose this project to automate the matching and verification process, making it secure and hands-free.

### Why AI? Why Gemini?
AI is required because humans describe items differently (e.g., "navy flask" vs "dark blue bottle"). We use Google Gemini 1.5 Flash because it excels at processing multimodal inputs (images to JSON text) and naturally parsing varied human language. It structures the messy data so our matching algorithm can process it efficiently.

### How does image matching work?
When an item is found, an image is uploaded. Gemini extracts "public characteristics" (color, shape, brand) into a structured JSON format. Our internal `MatchingService` then compares these exact JSON fields against the public characteristics submitted by students who lost items, scoring them out of 100 to rank potential candidates.

### Why separate public and private characteristics?
Public characteristics are used for broad AI matching, but they are easily guessable. Private characteristics (e.g., a specific scratch, exact contents) are used to definitively prove ownership. By keeping private characteristics strictly hidden on the server, we prevent fraudsters from falsely claiming items.

### How is ownership verified? Why is matching not enough?
Matching just means the item *looks* like what was lost. Ownership is verified by challenging the user to answer a question based on their secret private characteristics. Gemini AI evaluates their answer against the hidden database record. 

### How does OTP work?
Once AI verification passes, a 6-digit OTP is generated, hashed securely using bcrypt, and sent to the student's registered college email via Resend. The user must enter this OTP on the frontend. This proves that the person clicking the claim link is actually the owner of the college email account.

### Why Firebase? Why Supabase? Why Vercel?
- **Firebase** provides robust passwordless authentication and a scalable NoSQL database (Firestore) perfect for rapid, flexible document storage.
- **Supabase Storage** is used because it provides excellent, dedicated S3-compatible image hosting separate from our database logic, keeping Firestore clean.
- **Vercel** is the native hosting platform for Next.js, providing zero-configuration serverless deployments and edge network performance.

### How are images stored?
Images are uploaded to a Supabase storage bucket via a secure, server-side API route. The client never talks to Supabase directly, preventing unauthorized uploads.

### How are secrets protected?
All sensitive keys (Firebase Admin, Supabase Secret, Gemini API key, Resend API key) are stored in server-side environment variables (`.env.local`). We use Next.js API Routes (Serverless Functions) so that these secrets are never bundled into the client-side JavaScript.

### How does RBAC work?
Role-Based Access Control is enforced using Firebase Custom Claims. Users are assigned either a `student` or `admin` role upon registration. Middleware and Server APIs check the JWT token for this claim; if a student attempts to access an admin route, they are blocked with a 403/Unauthorized response.

### What happens if multiple people claim the same item?
The system uses a **Sequential Candidate Workflow**. Candidates are ranked by match score. The system emails *only* the top candidate. If they decline ("NO, THIS IS NOT MINE") or fail verification, the system automatically moves to the next highest-scoring candidate.

### What happens if the first candidate says NO?
An API endpoint (`/api/claims/decline`) marks their match as declined and automatically triggers the `MatchingService` to email the next candidate in the queue.

### What happens after 7 days?
If an item sits in the F!ndSyncR Box for 7 days without being claimed, it enters an `expired` state. It appears on the Admin Dashboard so campus security can physically remove it and donate/discard it, freeing up hardware space.

### Why is there a 48-hour collection window?
To prevent the physical hardware lockbox from filling up indefinitely with items that people have claimed but never bothered to pick up. If not collected in 48 hours, the claim is voided so the item can be matched to someone else or expired.

### Why doesn't OTP immediately unlock the hardware?
The OTP verifies digital ownership. However, the student might be in their dorm room when they complete the OTP. If it unlocked the hardware immediately, the box would pop open while the student isn't there. Therefore, OTP grants "Collection Authorization." The student must physically go to the box to trigger the unlock.

### How will Raspberry Pi integrate later?
The Term-I software is already built as an API. The Raspberry Pi will simply act as a client. It will take photos and `POST` them to our existing `/api/found-items` route. To unlock, it will send a request to verify the student's ID against the `ownership_confirmed` status in our database.

### What happens if the hardware is offline?
Term-I acts as a standalone platform. If the hardware is offline in Term-II, the system degrades gracefully into a manual system where Admins can use the web dashboard to intake items and verify manual pickups.

### What are the limitations?
AI vision accuracy is limited by image quality (e.g., poor lighting, blurry photos). The system also depends on the student accurately describing their lost item.

### What will be added in Term II?
Term II focuses entirely on the physical hardware: a Raspberry Pi, a camera, electronic locks, a QR scanner, and the physical enclosure for the F!ndSyncR Box.
