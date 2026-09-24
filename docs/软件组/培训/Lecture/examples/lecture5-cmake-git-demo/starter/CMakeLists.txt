cmake_minimum_required(VERSION 3.20)
project(hello_cmake LANGUAGES C)

add_executable(hello main.c)
target_compile_features(hello PRIVATE c_std_11)
