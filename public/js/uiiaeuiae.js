document.getElementById("shortenForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const longUrl = document.getElementById("longUrl").value;
  const customAlias = document.getElementById("customAlias").value;
  const topic = document.getElementById("topic").value;

  const response = await fetch("/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ longUrl, customAlias, topic })
  });

  const data = await response.json();
  
  if (response.ok) {
    const newRow = `<tr>
      <td><a href="${data.full}">${data.full}</a></td>
      <td><a href="/${data.short}">${data.short}</a></td>
      <td>${data.topic || "N/A"}</td>
      <td>${data.clicks || 0}</td>
      <td><button onclick="deleteThisShit('${data.short}')">Delete</button></td>
      <td><button onclick="viewAnalytics('${data.short}')">Analytics</button></td>
    </tr>`;

    document.getElementById("urlTableBody").innerHTML += newRow;
  } else {
    alert("Error: " + data.error);
  }
});

async function shortenURL(event) {
  event.preventDefault();

  const fullUrl = document.getElementById("fullUrl").value;
  const topic = document.getElementById("topic").value || "N/A";

  if (!fullUrl.trim()) {
      alert("Please enter a valid URL.");
      return;
  }

  try {
      const response = await fetch("/api/shorten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full: fullUrl, topic })
      });

      if (!response.ok) throw new Error("Failed to shorten URL");

      const data = await response.json();
      console.log("Shortened URL Data:", data);

      addShortenedUrlToPage(data);

      document.getElementById("fullUrl").value = "";
      document.getElementById("topic").value = "";
  } catch (error) {
      console.error("cant shortening URL:", error);
      alert("error when creating short URL.");
  }
}

function addShortenedUrlToPage(data) {
  const urlList = document.getElementById("urlList");
  const newRow = document.createElement("tr");

  newRow.innerHTML = `
      <td>${data.full}</td>
      <td><a href="/${data.short}" target="_blank">${data.short}</a></td>
      <td>${data.topic || "N/A"}</td>
      <td>${data.clicks || 0}</td>
      <td>
          <button onclick="viewAnalytics('${data.short}')">Analytics</button>
          <button onclick="deleteURL('${data._id}')">Delete</button>
      </td>
  `;

  urlList.appendChild(newRow);
}



async function deleteThisShit(urlId) {
  console.log("deleting URL of ID:", urlId);
  if (!urlId || urlId === "undefined") {
      alert("invalid URL ID");
      return;
  }
  try {
      const response = await fetch(`/api/delete/${urlId}`, { method: "DELETE" });

      if (response.ok) {
          alert("URL deleted");
          document.querySelector(`[data-id="${urlId}"]`).remove();
      } else {
          const data = await response.json();
          alert("error: " + (data.error || "failed to delete URL."));
      }
  } catch (error) {
      console.error("error:", error);
      alert("cant delete URL.");
  }
}

async function viewAnalytics(shortUrl) {
  console.log("gettin analytics for:", shortUrl);

  try {
      const response = await fetch(`/api/analytics/${shortUrl}`);
      if (!response.ok) throw new Error("cant fetch analytics");

      const data = await response.json();
      console.log("analytics data: ", data);

      if (!data.analytics || data.analytics.length === 0) {
          alert("no analytics found");
          return;
      }

      // Build table rows for each click
      let analyticsRows = data.analytics.map(click => `
          <tr>
              <td>${click.timestamp}</td>
              <td>${click.ip || "N/A"}</td>
              <td>${click.os || "N/A"}</td>
              <td>${click.device || "N/A"}</td>
              <td>${click.location?.city || "Unknown"}, ${click.location?.country || "Unknown"}</td>
          </tr>
      `).join("");

      const modal = document.getElementById("analyticsModal");
      modal.innerHTML = `
          <div class="modal-content">
              <span class="close" onclick="closeModal()">&times;</span>
              <h2>Viewing: ${shortUrl}</h2>
              <p>Total Clicks: <b>${data.totalClicks || 0}</b> - Unique Users: <b>${data.uniqueUsers || 0}</b></p>
              <table>
                  <thead>
                      <tr>
                          <th>Time</th>
                          <th>IP Address</th>
                          <th>OS</th>
                          <th>Device</th>
                          <th>Location</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${analyticsRows || "<tr><td colspan='5'>No Data Available</td></tr>"}
                  </tbody>
              </table>
          </div>`;

      modal.style.display = "block";
  } catch (err) {
      console.error("cant fetch analytics:", err);
      alert("error loading analytics.");
  }
}

function closeModal() {
  document.getElementById("analyticsModal").style.display = "none";
}

function closeModal() {
  const modal = document.getElementById("analyticsModal");
  if (modal) {
     modal.style.display = "none";
  }
 }
  