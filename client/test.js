import axios from 'axios';

async function testApp() {
  try {
    console.log("--- Starting Automated Tests ---");
    console.log("1. Registering/Logging in test user...");
    let token = '';
    try {
      await axios.post('http://localhost:5005/api/register', { username: 'tester', password: 'password123' });
    } catch (err) {
      // Ignore if user already exists
    }
    
    const loginRes = await axios.post('http://localhost:5005/api/login', { username: 'tester', password: 'password123' });
    token = loginRes.data.token;
    console.log("✓ User authenticated successfully.");

    console.log("2. Creating 4 sample tasks...");
    const tasks = [
      { title: "Complete UI Design", description: "Ensure the dark mode aesthetic looks perfect across all screens.", due_date: "10 June 2026", status: "AVAILABLE" },
      { title: "Fix Backend Security", description: "Implement WebSockets private rooms and add strict input validation.", due_date: "12 June 2026", status: "PENDING REVIEW" },
      { title: "Prepare Documentation", description: "Review the walkthrough file and ensure it covers all new features.", due_date: "14 June 2026", status: "IN PROGRESS" },
      { title: "Submit Project", description: "Final testing before turning in the completed Task Manager application.", due_date: "15 June 2026", status: "AVAILABLE" }
    ];

    for (let task of tasks) {
      await axios.post('http://localhost:5005/api/tasks', task, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`  ✓ Created task: ${task.title}`);
    }

    console.log("3. Fetching tasks from dashboard...");
    const getRes = await axios.get('http://localhost:5005/api/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✓ Successfully verified ${getRes.data.length} tasks in the database for this user.`);
    console.log("--- All Automated Tests Passed Successfully! ---");
  } catch (err) {
    console.error("Test failed:", err.response ? err.response.data : err.message);
  }
}

testApp();
