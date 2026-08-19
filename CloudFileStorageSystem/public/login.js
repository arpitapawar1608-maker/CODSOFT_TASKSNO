document.getElementById("loginForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        const response = await fetch("/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        alert(data.message);

        if (response.ok) {

            localStorage.setItem("user", email);

            window.location.href = "/dashboard";

        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

    }

});