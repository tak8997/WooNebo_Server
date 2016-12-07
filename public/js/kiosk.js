$(function(){
    var img = $('<input>').attr({
        'type': 'file',
        'name': 'uploadFile'
    });
    var form = $('<form>').attr('enctype', 'multipart/form-data');
    form.append(img);
    form.on('submit', function (e) {
        e.preventDefault();

        if (img.val() === "") {
            return;
        }

        var formData = new FormData($(this)[0]);

        $.ajax({
            url: window.location.origin + '/uploads',
            type: 'POST',
            data: formData,
            async: false,
            cache: false,
            contentType: false,
            processData: false,
            success: function (res) {
                $('#kiosk-img').attr('src', res);
                $('#kiosk-img-path').val(res);
            },
            error: function(res) {
                alert('업로드 실패');
            }
        });

        return false;
    });
    img.on('change', function() {
        form.submit();
    });

    $('.list').each(function(index) {
        $('.list').eq(index).click(function() {
            window.location.assign('/admins/kiosks/' + this.id);
        });
    });
    $('#kiosk-new').click(function(){
        window.location.assign('/admins/kiosks/new');
    });
    $('#kiosk-img-path').css('display', 'none');
    $('#kiosk-img').on('click', function() {
        img.click();
    });
});
