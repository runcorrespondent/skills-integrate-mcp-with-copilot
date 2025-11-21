document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");

  // Modal for registration
  let modal = document.createElement('div');
  modal.id = 'register-modal';
  modal.className = 'hidden';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h3>Register for Activity</h3>
      <form id="modal-signup-form">
        <div class="form-group">
          <label for="modal-email">Student Email:</label>
          <input type="email" id="modal-email" required placeholder="your-email@mergington.edu" />
        </div>
        <input type="hidden" id="modal-activity" />
        <button type="submit">Sign Up</button>
      </form>
      <div id="modal-message" class="hidden"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <button class="register-btn" data-activity="${name}">Register Student</button>
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to register buttons
      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const activity = button.getAttribute("data-activity");
          document.getElementById('modal-activity').value = activity;
          modal.classList.remove('hidden');
        });
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showModalMessage(result.message, false);
        fetchActivities();
      } else {
        showModalMessage(result.detail || "An error occurred", true);
      }
    } catch (error) {
      showModalMessage("Failed to unregister. Please try again.", true);
      console.error("Error unregistering:", error);
    }
  }

  // Modal signup form logic
  document.getElementById('modal-signup-form').addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("modal-email").value;
    const activity = document.getElementById("modal-activity").value;
    if (!activity) return;
    await registerParticipant(activity, email);
    document.getElementById('modal-signup-form').reset();
  });

  // Modal close logic
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Show message in modal
  function showModalMessage(msg, isError) {
    const modalMsg = document.getElementById('modal-message');
    modalMsg.textContent = msg;
    modalMsg.className = isError ? "error" : "success";
    modalMsg.classList.remove("hidden");
    setTimeout(() => {
      modalMsg.classList.add("hidden");
      if (!isError) {
        modal.classList.add('hidden');
      }
    }, 2000);
  }

  // Initialize app
  fetchActivities();
});
