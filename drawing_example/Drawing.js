const drawingCode = `
# draws diagonal line to the screen

#declare variables
mov 0 &0    # i

:clearMemory
    # calculate video memory address
    add vm &0
    mov res &1

    # write value to video memory
    mov 0 &&1

    # advance loop
    add 1 &0
    mov res &0
    cmp res 128
    jlt :clearMemory

# write current pixel
add vm vl
mov 1 &res

end
`;