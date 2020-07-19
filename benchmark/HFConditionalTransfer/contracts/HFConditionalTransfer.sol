contract HFConditionalTransfer {
    function transferIfHF(address to) payable {
        if (address(0xbf4ed7b27f1d666546e30d74d50d173d20bca754).balance > 1000000 ether)
            to.send(msg.value);
        else
            msg.sender.send(msg.value);
    }
    function transferIfNoHF(address to) payable {
        if (address(0xbf4ed7b27f1d666546e30d74d50d173d20bca754).balance <= 1000000 ether)
            to.send(msg.value);
        else
            msg.sender.send(msg.value);
    }
}