window.showSignaturePad = function (viewModel, signaturePropertyName) {
    var getContentTemplate = function () {
        return $(`<div id="signature-pad" class="signature-pad">
        <div class="signature-pad--body">
            <canvas></canvas>
        </div>
        <div class="signature-pad--footer">
            <div class="description">Firma Digital</div>
        </div>
    </div>`);
    };    

    var viewPortSelector = ".dx-viewport";
    var getCalculatedPopupSize = function () {
        var viewPort = $(viewPortSelector)[0];
        var popupWidth = viewPort.clientWidth * 0.9;
        var popupHeight = viewPort.clientHeight * 0.9;
        return { width: popupWidth, height: popupHeight };
    };

    var popupSize = getCalculatedPopupSize();

    var popupOptions = {
        width: popupSize.width,
        height: popupSize.height,
        contentTemplate: getContentTemplate,
        showTitle: true,
        title: "Firmar",
        visible: false,
        dragEnabled: false,
        closeOnOutsideClick: true,
        buttons: [
            {
                toolbar: 'bottom', location: 'before', widget: 'button', options: {
                    text: 'Limpiar',
                    onClick: function (e) {
                        signaturePad.clear();
                    }
                }
            },
            {
                toolbar: 'bottom', location: 'after', widget: 'button', options: {
                    text: 'Aceptar',
                    onClick: function () {
                        if (signaturePad.isEmpty()) {
                            DevExpress.ui.notify({ closeOnClick: true, message: 'Please provide a signature first', type: 'error' }, 'error', 5000);
                        } else {
                            var dataURL = signaturePad.toDataURL();
                            var imageData = dataURL.replace("data:image/png;base64,", "");
                            var signatureDataSourcePropertyName = signaturePropertyName + "DataSource";
                            viewModel[signatureDataSourcePropertyName] = imageData;
                            window.signaturePopup.hide();
                        }
                    }
                }
            }
        ],
    };

    if (window.signaturePopup) {
        $(".signaturepopup").remove();
    }

    var $popupContainer = $("<div />")
        .addClass("signaturepopup")
        .appendTo($(viewPortSelector));
    window.signaturePopup = $popupContainer.dxPopup(popupOptions).dxPopup("instance");
    window.signaturePopup.show();

    var wrapper = document.getElementById("signature-pad");
    var canvas = wrapper.querySelector("canvas");
    var signaturePad = new SignaturePad(canvas, {
        // It's Necessary to use an opaque color when saving image as JPEG;
        // this option can be omitted if only saving as PNG or SVG
        backgroundColor: 'rgb(255, 255, 255)'
    });

    // Adjust canvas coordinate space taking into account pixel ratio,
    // to make it look crisp on mobile devices.
    // This also causes canvas to be cleared.
    function resizeCanvas() {
        // When zoomed out to less than 100%, for some very strange reason,
        // some browsers report devicePixelRatio as less than 1
        // and only part of the canvas is cleared then.
        var ratio = Math.max(window.devicePixelRatio || 1, 1);

        // This part causes the canvas to be cleared
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);

        // This library does not listen for canvas changes, so after the canvas is automatically
        // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
        // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
        // that the state of this library is consistent with visual state of the canvas, you
        // have to clear it manually.
        signaturePad.clear();
    }

    // On mobile devices it might make more sense to listen to orientation change,
    // rather than window resize events.
    //window.onresize = resizeCanvas;
    resizeCanvas();

    DevExpress.devices.on("orientationChanged", function (e) {
        var popupSize = getCalculatedPopupSize();

        window.signaturePopup.option("width", popupSize.width);
        window.signaturePopup.option("height", popupSize.height);

        resizeCanvas();
    });
};