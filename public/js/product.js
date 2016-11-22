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
                $('#product-img').attr('src', res);
                $('#product-img-path').val(res);
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
            window.location.assign('/admins/products/' + this.id);
        });
    });
    $('#product-new').click(function() {
        window.location.assign('/admins/products/new');
    });
    $('#product-img-path').css('display', 'none');
    $('#product-img').on('click', function() {
        img.click();
    });
    $('.delete-button').click(function(e) {
        e.stopPropagation();

        var id = $(this).parent().parent().attr('id');

        var form = $('<form>').attr({
            action: '/admins/products/' + id + '?method=DELETE',
            method: 'POST'
        });

        if (confirm("정말로 삭제 하시겠습니까? \n해당 상품을 삭제하실경우 연관된 데이터가 전부 삭제됩니다.") === true) {
            form.submit();
        }
    });
});
