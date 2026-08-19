document.addEventListener("DOMContentLoaded", function () {

    const navbarAuth = document.getElementById("navbar-auth");
    const footerAuth = document.getElementById("footer-auth");

    fetch("/auth/me", {
        method: "GET",
        credentials: "include"
    })
    .then(response => {

        if (!response.ok) {
            throw new Error("Not logged in");
        }

        return response.json();
    })
    .then(user => {

        // =========================
        // NAVBAR - LOGGED IN
        // =========================

        if (navbarAuth) {
    navbarAuth.innerHTML = `
        <span class="nav-link">
            Hi, ${user.full_name.split(" ")[0]} 👋
        </span>

        <a href="/auth/logout" class="nav-login">
            Logout
        </a>
    `;
}


        // =========================
        // FOOTER - LOGGED IN
        // =========================

        if (footerAuth) {
            footerAuth.innerHTML = `
                <h4>Account</h4>

                <span>
                    ${user.full_name}
                </span>

                <a href="/auth/logout">
                    Logout
                </a>
            `;
        }

    })
    .catch(() => {

        // =========================
        // NAVBAR - LOGGED OUT
        // =========================

        if (navbarAuth) {
            navbarAuth.innerHTML = `
                <a href="/login" class="nav-login">
                    Login
                </a>

                <a href="/register" class="nav-register">
                    Create Account
                </a>
            `;
        }


        // =========================
        // FOOTER - LOGGED OUT
        // =========================

        if (footerAuth) {
            footerAuth.innerHTML = `
                <h4>Account</h4>

                <a href="/login">
                    Login
                </a>

                <a href="/register">
                    Create Account
                </a>
            `;
        }

    });

});