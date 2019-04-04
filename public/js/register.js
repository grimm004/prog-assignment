/* eslint-env browser */
"use strict";

$(function () {
    $("#confirm-password-input").on("input", () =>
        $("#confirm-password-input")[0].setCustomValidity($("#password-input").val() == $("#confirm-password-input").val() ? "" : "Passwords do not match..."));

    $("#register-form").submit(function (event) {
        event.preventDefault();
        //var email = $("#email-input").val();
        //var password = $("#password-input").val();
    });

    // function showAlert(type, title, message) {
    //     $("div#alerts").html(`
    //     <div class="alert alert-${ type} alert-dismissible fade show">
    //         <button type="button" class="close" data-dismiss="alert">&times;</button>
    //         <strong>${ title}</strong> ${message}
    //     </div>
    //     `);
    // }
});
