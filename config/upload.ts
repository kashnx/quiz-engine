const upload_limit: number = 10; // Maximum file size upload limit in MB

const questions_range: [number, number] = [5, 50]; // min, max number of questions

const pages_limit: number = 200; // Maximum number of pages to process from the PDF

const max_file_size: number = upload_limit * 1024 * 1024; // Convert MB to bytes

export { upload_limit, questions_range, pages_limit, max_file_size };
// ? This file defines the configuration for file uploads in the application