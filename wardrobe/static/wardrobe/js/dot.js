function selectDot(selectedDot) {
    document.querySelectorAll('.dot').forEach(dot => dot.classList.remove('selected'));
    selectedDot.classList.add('selected');
}
document.getElementById('toggleLegs').addEventListener('change', function () {
    if (this.checked) {
        console.log('Nóżki włączone');
    } else {
        console.log('Nóżki wyłączone');
    }
});

document.getElementById("toggleLegs").addEventListener("change", function() {
    document.getElementById("legsHeight").style.display = this.checked ? "block" : "none";
});