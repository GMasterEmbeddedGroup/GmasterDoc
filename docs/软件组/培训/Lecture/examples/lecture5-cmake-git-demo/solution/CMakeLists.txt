cmake_minimum_required(VERSION 3.20)
project(calc_demo VERSION 1.0 LANGUAGES C)

option(ENABLE_TRACE "Print calculation trace" OFF)

add_subdirectory(lib)
add_executable(calc_demo src/main.c)
target_link_libraries(calc_demo PRIVATE calc)
target_compile_features(calc_demo PRIVATE c_std_11)

if(ENABLE_TRACE)
    target_compile_definitions(calc_demo PRIVATE ENABLE_TRACE=1)
endif()

if(CMAKE_C_COMPILER_ID MATCHES "GNU|Clang")
    target_compile_options(calc_demo PRIVATE -Wall -Wextra -Wpedantic)
endif()
