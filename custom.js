// Custom JavaScript for Go Interview Questions book

document.addEventListener("DOMContentLoaded", function () {
  // Add copy button to code blocks
  document.querySelectorAll("pre code").forEach(function (codeBlock) {
    const button = document.createElement("button");
    button.className = "copy-button";
    button.textContent = "Copy";

    button.addEventListener("click", function () {
      navigator.clipboard.writeText(codeBlock.textContent).then(function () {
        button.textContent = "Copied!";
        setTimeout(function () {
          button.textContent = "Copy";
        }, 2000);
      });
    });

    const pre = codeBlock.parentNode;
    pre.style.position = "relative";
    button.style.position = "absolute";
    button.style.top = "0.5em";
    button.style.right = "0.5em";
    pre.appendChild(button);
  });

  // Add difficulty level indicators
  document.querySelectorAll(".difficulty").forEach(function (element) {
    const level = element.textContent.toLowerCase();
    element.className = "difficulty difficulty-" + level;
  });

  // Add collapsible sections for solutions
  document.querySelectorAll(".solution").forEach(function (solution) {
    const button = document.createElement("button");
    button.className = "solution-toggle";
    button.textContent = "Show Solution";

    solution.style.display = "none";

    button.addEventListener("click", function () {
      if (solution.style.display === "none") {
        solution.style.display = "block";
        button.textContent = "Hide Solution";
      } else {
        solution.style.display = "none";
        button.textContent = "Show Solution";
      }
    });

    solution.parentNode.insertBefore(button, solution);
  });

  // Add syntax highlighting for Go code
  if (typeof hljs !== "undefined") {
    document.querySelectorAll("pre code").forEach(function (block) {
      hljs.highlightBlock(block);
    });
  }

  // Add search functionality
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Search...";
  searchInput.className = "search-input";

  const searchResults = document.createElement("div");
  searchResults.className = "search-results";

  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const results = [];

    document
      .querySelectorAll("h1, h2, h3, h4, h5, h6, p")
      .forEach(function (element) {
        if (element.textContent.toLowerCase().includes(query)) {
          results.push({
            text: element.textContent,
            element: element,
          });
        }
      });

    searchResults.innerHTML = "";
    results.forEach(function (result) {
      const div = document.createElement("div");
      div.textContent = result.text;
      div.addEventListener("click", function () {
        result.element.scrollIntoView({ behavior: "smooth" });
      });
      searchResults.appendChild(div);
    });
  });

  document.body.insertBefore(searchInput, document.body.firstChild);
  document.body.insertBefore(searchResults, searchInput.nextSibling);
});
