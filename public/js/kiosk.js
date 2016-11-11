$(function(){
    $('.list').each(function(index) {
        $('.list').eq(index).click(function() {
            window.location.assign(window.location.href + '/' + this.id);
        });
    });
    $('#kiosk-new').click(function(){
        window.location.assign(window.location.href + '/new');
    });
});
