const fibbonacciCode = `
# Logs the first 25 numbers in the fibbonacci sequence

# Only run once during v-blank
cmp vb 0
jeq :end

#declare variables
mov 0 &0    # i

:loop
    # calculate fibbonacci
    push &0
    call :fibbonacci
    log res
    pop 1

    #increment loop
    add 1 &0
    mov res &0
    cmp res 25
    jlt :loop
jmp :end

:fibbonacci
    # expects $0 to be the input number
    # stores result in 'res'

    cmp $0 1
    jgt :calcFib
    mov $0 res
    jmp :fibEnd

    :calcFib

    # calculate branch 1
    sub $0 1
    push r2
    push ret
    push res
    call :fibbonacci
    mov $1 ret
    mov $2 r2
    pop 3
    mov res r1

    # calculate branch 2
    sub $0 2
    push r1
    push ret
    push res
    call :fibbonacci
    mov $1 ret
    mov $2 r1
    pop 3
    mov res r2

    add r1 r2

    :fibEnd
    ret

:end
end
`;