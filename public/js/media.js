$(function(){
    $('.list').each(function(index) {
        $('.list').eq(index).click(function() {
            window.location.assign('/admins/medias/' + this.id);
        });
    });
    $('#media-new').click(function(){
        window.location.assign(window.location.href + '/new');
    });
    $('input.playAt:first').change(function() {
        $(this).val(0);
    });
    $('input.delete:first').attr('disabled', true);
    $('input.delete').click(function() {
        $(this).parent().parent().detach();
    });
    $('input.add').click(function() {
        var tr = $('tr:last').clone();

        tr.appendTo($('tbody'));
        $('tr:last').children(':last').children().attr('disabled', false).click(function() {
            $(this).parent().parent().detach();
        });
    });
    $('.delete-button').click(function(e) {
        e.stopPropagation();

        var id = $(this).parent().parent().attr('id');
        var form = $('<form>').attr({
            action: '/admins/medias/' + id + '?method=DELETE',
            method: 'post'
        });

        if (confirm("정말로 삭제 하시겠습니까? \n해당 파일정보를 삭제하실경우 연관된 데이터가 전부 삭제됩니다.") === true) {
            form.submit();
        }
    });
});
