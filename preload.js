// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }
    var lastRow = 0

    function newRow(a, b, c, d) {
        console.log(data)
        var table = document.getElementById("trades");
        var row = table.insertRow(table.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);

        cell3.innerHTML = c['stopPx']
        cell4.innerHTML = b['stopPx']
        cell1.innerHTML = side;
        cell2.innerHTML = open_price;
        //return cell1, cell2, cell3, cell4, cell5, cell6
        row_count = row_count + 1
    }
    var orders = []
    var row_count = 0
    const ConfigParser = require('configparser');
    const Config = new ConfigParser();
    Config.read('config.ini');
    const bitmex_api_key = Config.get("Bitmex", "api_key")
    const bitmex_api_secret = Config.get("Bitmex", "api_secret")
    var open_price = 0
    var side = ''
    var qty = 0
    var id = []
    for (const type of['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
    var bal = 0
    const bitmexClient = require('bitmex-realtime-api');
    const client = new bitmexClient({ testnet: false, apiKeyID: bitmex_api_key, apiKeySecret: bitmex_api_secret });
    client.addStream('XBTUSD', 'position', function(data, symbol, tableName) {
        //console.log(data) 

        document.getElementById('leverage').innerHTML = data[0]['leverage'] + 'X'
        open_price = data[0]['avgEntryPrice']
        if (data[0]['currentQty'] > 0) {
            document.getElementById('side').innerHTML = 'LONG @ ' + data[0]['avgEntryPrice']
            document.getElementById('profit').innerHTML = ((1 / data[0]['avgEntryPrice']) - (1 / data[0]['markPrice'])) * data[0]['currentQty']
            side = 'LONG'

        } else if (data[0]['currentQty'] < 0) {
            document.getElementById('side').innerHTML = "SHORT @ " + data[0]['avgEntryPrice']
            document.getElementById('profit').innerHTML = ((1 / data[0]['markPrice']) - (1 / data[0]['avgEntryPrice'])) * -data[0]['currentQty']
            side = 'SHORT'
        } else {
            document.getElementById('side').innerHTML = 'NONE'
            document.getElementById('profit').innerHTML = 0
        }
        qty = data[0]['currentQty']
    });
    client.addStream("XBTUSD", 'quote', function(data, symbol, tableName) {
        var price = data[data.length - 1]['bidPrice']
        document.getElementById('price').innerHTML = price
        document.getElementById('usd').innerHTML = price * bal
    })
    client.addStream("user", 'margin', function(data, symbol, tableName) {
        const init_profit = 0.00103732 //starting balance
        bal = data[0]['marginBalance'] / 100000000
        document.getElementById('balance').innerHTML = data[0]['marginBalance'] / 100000000
        var change = (data[0]['marginBalance'] / 100000000 - init_profit) / init_profit * 100
        document.getElementById('balance_change').innerHTML = change
        if (change > 0) {
            document.getElementById('balance_change').style.color = 'green'
        } else if (change < 0) {
            document.getElementById('balance_change').style.color = 'red'
        } else {
            document.getElementById('balance_change').style.color = 'black'
        }
    })
    client.addStream("XBTUSD", 'order', function(data, symbol, tableName) {
        for (i = 0; i < data.length; i++) {
            var op, tp, sl, close
            if (data[i]['ordType'] == 'Market' && data[i]['clOrdID'].includes('buy:') || data[i]['clOrdID'].includes('short:')) {
                op = data[i]
            } else if (data[i]['ordType'] == 'MarketIfTouched' && data[i]['clOrdID'].includes("tp:")) {
                tp = data[i]
            } else if (data[i]['ordType'] == 'Stop' && data[i]['clOrdID'].includes('sl:')) {
                sl = data[i]
            } else if (data[i]['ordType'] == 'Market' && data[i]['clOrdID'].includes('close:')) {
                close = data[i]
            }
            if (op && !close) {
                newRow(op, tp, sl, close) // if new trade make new row
            } else if (close) {
                var x = document.getElementById("trades").rows[row_count].cells; // else if close, close the last order
                x[4].innerHTML = close['avgEntryPrice'];
                cl = close['avgEntryPrice']
                if (side == 'LONG') {
                    profi = (1 / open_price) - (1 / cl) * qty
                    fee = profi * 0.0075
                    profi = profi - fee
                } else if (side == 'SHORT') {
                    profi = (1 / cl) - (1 / open_price) * -qty
                    fee = profi * 0.0075
                    profi = profi - fee
                } else {
                    profi = 0
                }
                x[5].innerHTML = profi; // and set profit
            } else if (sl['triggered'] != '') {
                var x = document.getElementById("trades").rows[row_count].cells; // else if close, close the last order
                x[4].innerHTML = sl['stopPx'];
                cl = sl['stopPx']
                if (side == 'LONG') {
                    profi = (1 / open_price) - (1 / cl) * qty
                    fee = profi * 0.0075
                    profi = profi - fee
                } else if (side == 'SHORT') {
                    profi = (1 / cl) - (1 / open_price) * -qty
                    fee = profi * 0.0075
                    profi = profi - fee
                } else {
                    profi = 0
                }
                x[5].innerHTML = profi; // and set profit
            } else if (tp['triggered'] != '') {
                var x = document.getElementById("trades").rows[row_count].cells; // else if close, close the last order
                x[4].innerHTML = tp['stopPx'];
                cl = tp['stopPx']
                if (side == 'LONG') {
                    profi = (1 / open_price) - (1 / cl) * qty
                    fee = profi * 0.0075
                    profi = profi - fee
                } else if (side == 'SHORT') {
                    profi = (1 / cl) - (1 / open_price) * -qty
                    fee = profi * 0.0075
                    profi = profi - fee
                } else {
                    profi = 0
                }
                x[5].innerHTML = profi; // and set profit
            }
        }

    })
})