# Contributing to Stock Inventory App

Thank you for considering contributing to our Stock Inventory App! This document outlines the process for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

- Before creating a bug report, check the issue tracker to see if the problem has already been reported
- When creating a bug report, include as many details as possible:
  - A clear and descriptive title
  - Steps to reproduce the issue
  - Expected behavior
  - Actual behavior
  - Screenshots if applicable
  - Your environment details (OS, browser, etc.)

### Suggesting Enhancements

- Before creating an enhancement suggestion, check the issue tracker to see if it has been suggested
- When creating an enhancement suggestion, include:
  - A clear and descriptive title
  - Step-by-step description of the suggested enhancement
  - Explanation of why this enhancement would be useful

### Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Make sure your code lints properly (`pnpm run lint`)
5. Make sure all tests pass (`pnpm run test`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Create a Pull Request

## Development Setup

1. Clone your fork of the repository
2. Install dependencies with `pnpm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
4. Start the development server with `pnpm dev`

## Style Guide

- Follow the TypeScript and ESLint configurations in the project
- Use meaningful variable and function names
- Write comments for complex logic
- Follow the existing code style

## Testing

- Write tests for new features
- Ensure all tests pass before submitting a PR
- Aim for good test coverage

## Commit Guidelines

- Use clear and meaningful commit messages
- Reference issues and pull requests where appropriate
- Begin commit messages with a type:
  - feat: A new feature
  - fix: A bug fix
  - docs: Documentation only changes
  - style: Changes that do not affect the meaning of the code
  - refactor: A code change that neither fixes a bug nor adds a feature
  - perf: A code change that improves performance
  - test: Adding missing tests or correcting existing tests
  - chore: Changes to the build process or auxiliary tools

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.

Thank you for your contributions!