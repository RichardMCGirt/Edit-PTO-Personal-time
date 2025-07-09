(function () {
    const correctPassword = "Vanir";
    const mainScriptSrc = "edit.js"; // <-- Change this if your script filename/path is different

    // If already authenticated, restore app (if needed) and inject main script
    if (localStorage.getItem("vanirAuthorized") === "true") {
        // Only inject script if it's not already present
        if (!document.querySelector(`script[src="${mainScriptSrc}"]`)) {
            var mainScript = document.createElement('script');
            mainScript.src = mainScriptSrc;
            mainScript.type = "text/javascript";
            document.body.appendChild(mainScript);
        }
        return;
    }

    // Save the original HTML so we can restore it after authentication
    const originalHtml = document.body.innerHTML;

    // Immediately hide the page content
    document.body.style.margin = "0";
    document.body.innerHTML = "";

    // Create the full-page black overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.backgroundColor = "black";
    overlay.style.color = "white";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";
    overlay.style.fontFamily = "sans-serif";

    const heading = document.createElement("h2");
    heading.textContent = "Please enter the password";

    const input = document.createElement("input");
    input.type = "password";
    input.placeholder = "Enter Password";
    input.style.padding = "12px";
    input.style.fontSize = "18px";
    input.style.borderRadius = "6px";
    input.style.border = "1px solid #ccc";
    input.style.marginTop = "10px";

    const button = document.createElement("button");
    button.textContent = "Submit";
    button.style.marginTop = "10px";
    button.style.padding = "10px 20px";
    button.style.fontSize = "16px";
    button.style.borderRadius = "6px";
    button.style.cursor = "pointer";

    const error = document.createElement("p");
    error.textContent = "Incorrect password";
    error.style.color = "red";
    error.style.marginTop = "10px";
    error.style.display = "none";

    button.onclick = () => {
        if (input.value.trim() === correctPassword) {
            localStorage.setItem("vanirAuthorized", "true");
            // Restore the main page HTML
            document.body.innerHTML = originalHtml;
            // Remove the overlay (not strictly necessary since we wiped innerHTML)
            // overlay.remove();

            // Dynamically inject your main app script so it runs on restored HTML
            var mainScript = document.createElement('script');
            mainScript.src = mainScriptSrc;
            mainScript.type = "text/javascript";
            document.body.appendChild(mainScript);
        } else {
            error.style.display = "block";
        }
    };

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") button.click();
    });

    overlay.appendChild(heading);
    overlay.appendChild(input);
    overlay.appendChild(button);
    overlay.appendChild(error);
    document.body.appendChild(overlay);
})();
