
var id = document.getElementById('toki_id').value;

$.ajax({
    type: 'GET',
    url: "/levels/" + id,
    success: function (result) {
        render_chart(result);
    },
    error: function (err) {
    }
});


function render_chart(levels) {
    var ctx = document.getElementById('myChart').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Fly', 'Fight', 'Fire', 'Water', 'Electric', 'Ice'],
            datasets: [{
                label: 'Levels',
                data: levels,
                backgroundColor: [
                    'rgba(192, 192, 192, 0.2)',
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(255, 140, 0, 0.2)',
                    'rgba(0, 191, 255, 0.2)',
                    'rgba(255, 255, 0, 0.2)',
                    'rgba(0, 255, 255, 0.2)',
                ],
                borderColor: [
                    'rgba(192, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(0, 191, 255, 1)',
                    'rgba(255, 255, 0, 1)',
                    'rgba(0, 255, 255, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });

}