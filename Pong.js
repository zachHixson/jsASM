const code = `
cmp &0 1
jeq :start

#declare global variables
mov 287 &1 #screen width
mov 112 &2 #player Y
mov 112 &3 #AI Y

mov 1 &0

:start
    sub vb 0
    jeq :drawLine()
    end

:drawLine()
    push 0     # pixelIdx
    push 0     # video mem addr

    :renderLine
        #calc memory addr
        add vm $1
        mov res $0
        mov 0 r3

        #skip player paddle drawing if we're too far right
        cmp $1 20
        jgt :drawAIPaddle

        #get player paddle result
        push 15
        push &2
        push $3
        call :drawPaddle()
        pop 3
        max r1 r3
        mov res r3

        :drawAIPaddle
        #skip AI paddle drawing if we're too far left
        cmp $1 268
        jlt :setPixelValue

        push 273
        push &3
        push $3
        call :drawPaddle()
        pop 3
        max r1 r3
        mov res r3
        
        :setPixelValue
        mov r3 &$0
        add 1 $1
        mov res $1

        cmp $1 &1
        jle :renderLine

    pop 2
    end

:drawPaddle()
    # @param paddle center X
    # @param paddle center Y
    # @param current screen X pos
    # @out r1 = is pixel filled

    sub $0 $2    # subtract x pos from screen x
    abs res      # abs result
    sub res 5    # subtract width from result
    mov res r1   # store in r1

    sub vl $1    # subtract y pos from screen y
    abs res      # abs result
    sub res 50   # subtract height from result
    mov res r2   # store in r2

    max r1 r2    # take max
    mul res -1   # invert
    min res 1    # clamp
    max res 0    # clamp

    mov res r1
    ret
`;