"use strict";

$(() => {
    // Handle automatic scrolling
    $("#chat-history").scroll(() => autoScroll = $("#chat-history").scrollTop() + $("#chat-history").height() >= $("#chat-history")[0].scrollHeight - 1);

    var autoScroll = true;
    function updateScroll() {
        if (autoScroll)
            scrollToBottom();
    }

    function scrollToBottom() {
        $("#chat-history").scrollTop($("#chat-history")[0].scrollHeight);
    }

    scrollToBottom();

    $("#message-form").submit(
        e => {
            e.preventDefault();

            var message = $("#message-input").val();
            if (!isNullOrWhiteSpace(message)) {
                $("#message-input").val("");
                sendMessage(message);
                outputMessage("outgoing", message);
            }
        }
    );

    function sendMessage() {
        
    }

    function outputMessage(type, message) {
        $("#chat-history-column").append(`<div class="message"><div class="${type}">${message}</div></div>`);
        if (type == "outgoing") scrollToBottom();
        else updateScroll();
    }
});
