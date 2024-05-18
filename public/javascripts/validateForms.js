// JS for disabling form submissions if there are invalid fields
(function () {
    'use strict'
    
    // fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
    
    // loop over them and prevent submission
    // this .forEach is an array method which applies given function to every element of the array
    Array.from(forms)
        .forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
            }
    
            form.classList.add('was-validated')
        }, false)
        })
    }
)()