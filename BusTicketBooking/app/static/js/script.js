document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log("JavaScript Loaded");

        const forms = document.querySelectorAll("form");

        forms.forEach(function(form) {

            form.addEventListener(
                "submit",
                function() {

                    console.log("Form Submitted");

                    const button = form.querySelector("button");

                    if (button) {
                        button.disabled = true;
                        button.innerText = "Processing...";
                    }

                }
            );

        });

    }
);