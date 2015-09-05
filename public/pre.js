var ta = document.querySelector('textarea');
var button = document.querySelector('button');
button.addEventListener('click', function(e){
    e.preventDefault();
    var cursorPos = ta.selectionStart;
    var textAreaContent = ta.value;
    var textToAdd = '<pre></pre>';
    ta.value = textAreaContent.substring(0, cursorPos) + textToAdd + textAreaContent.substring(cursorPos);
});