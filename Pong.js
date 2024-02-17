const code = `
:start
    sub vb 0
    jeq :drawLine
    end

:drawLine
    #clear virtual memory
    mov vm r1  #start address
    add vm 224
    mov res r2 #destination address
    
    :clearLoop
        mov 0 &r1  #set virtual memory address
        add 1 r1
        mov res r1
        sub r1 r2
        jlt :clearLoop

    #draw point
    #mul vl 10
    #mov res r1 #r1 = offset
    #add r1 vm  #calculate virtual memory location
    #mov 1 &res #set virual memory address

    add vl vm #offset
    mov 1 &res

    end
`;