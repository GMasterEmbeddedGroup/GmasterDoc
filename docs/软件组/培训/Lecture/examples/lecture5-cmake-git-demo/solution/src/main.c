#include "calc.h"

#include <stdio.h>

int main(void) {
    printf("2 + 3 = %d\n", add_int(2, 3));
    printf("5 - 3 = %d\n", sub_int(5, 3));
#ifdef ENABLE_TRACE
    puts("trace: calculations completed");
#endif
    return 0;
}
