add_library(calc STATIC calc.c)
target_include_directories(calc PUBLIC ${PROJECT_SOURCE_DIR}/include)
target_compile_features(calc PUBLIC c_std_11)

if(CMAKE_C_COMPILER_ID MATCHES "GNU|Clang")
    target_compile_options(calc PRIVATE -Wall -Wextra -Wpedantic)
endif()
