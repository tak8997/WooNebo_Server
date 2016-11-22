$(function(){
    $('.list').each(function(index) {
        $('.list').eq(index).click(function() {
            window.location.assign('/admins/kiosks/' + this.id);
        });
    });
    $('#kiosk-new').click(function(){
        window.location.assign('/admins/kiosks/new');
    });
});
