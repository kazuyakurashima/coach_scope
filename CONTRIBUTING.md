# Contributing to CoachScope

Thank you for your interest in contributing to CoachScope! This document provides guidelines for contributing to the project.

## 🎯 Project Purpose

CoachScope is a verification and learning project for:
- Understanding Langfuse integration patterns
- Learning Supabase with AI applications
- Exploring structured LLM outputs
- Prototyping for future StudySpark integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Langfuse account and project
- OpenAI API key

### Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/coach_scope.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and fill in your credentials
5. Run the development server: `npm run dev`

## 🔧 Development Workflow

### Branch Naming
- `feature/` - New features (e.g., `feature/multi-turn-dialogue`)
- `fix/` - Bug fixes (e.g., `fix/toast-notification`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/api-routes`)

### Commit Messages
Follow conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat(api): add conversation history support

- Implement multi-turn dialogue tracking
- Store conversation context in Supabase
- Update Langfuse metadata with session info

Closes #42
```

## 📝 Code Guidelines

### TypeScript
- Use strict mode (already enabled)
- Define interfaces for all data structures
- Avoid `any` types - use `unknown` when necessary
- Use type inference where possible

### React/Next.js
- Use functional components with hooks
- Keep components small and focused
- Use `'use client'` directive only when necessary
- Prefer server components when possible

### API Routes
- Always include error handling
- Return consistent response format: `{ success: boolean, data?: any, error?: string }`
- Log errors to console and Langfuse traces
- Validate input data

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and colors
- Use semantic HTML elements

## 🧪 Testing

Before submitting a PR:
- [ ] Test locally with `npm run dev`
- [ ] Verify Supabase integration works
- [ ] Check Langfuse traces appear correctly
- [ ] Test feedback system (👍👎)
- [ ] Verify error handling with invalid inputs
- [ ] Test on different browsers (Chrome, Safari, Firefox)

## 📚 Documentation

When adding features:
- Update README.md if user-facing changes
- Update CLAUDE.md for development guidance
- Update docs/requirements.md for specification changes
- Add inline comments for complex logic
- Document new environment variables in .env.example

## 🔒 Security

**Never commit:**
- API keys or secrets
- `.env.local` files
- Personal credentials
- Sensitive user data

**Always:**
- Use environment variables for credentials
- Keep `.gitignore` up to date
- Review diffs before committing
- Follow principle of least privilege

## 🐛 Bug Reports

Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Error logs from console
- Screenshots if applicable

## 💡 Feature Requests

Use the feature request template and explain:
- What problem it solves
- Proposed solution
- Alternative approaches considered
- How it aligns with project goals

## 📋 Pull Request Process

1. **Create a branch** from `main`
2. **Make your changes** following code guidelines
3. **Test thoroughly** using the checklist above
4. **Update documentation** as needed
5. **Submit PR** using the template
6. **Respond to feedback** from reviewers
7. **Wait for approval** - at least one maintainer must approve

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Commented complex sections
- [ ] Updated relevant documentation
- [ ] No new warnings or errors
- [ ] Tested all changes thoroughly
- [ ] PR description is clear and complete

## 🎨 Design Philosophy

When contributing, keep in mind:
- **Simplicity** - Keep it minimal and focused
- **Clarity** - Code should be self-documenting
- **Reliability** - Error handling is crucial
- **Observability** - Always log to Langfuse
- **User Experience** - Intuitive and responsive UI

## 🤝 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unprofessional conduct

## 📞 Questions?

- **General questions**: Create a GitHub Discussion
- **Bug reports**: Use the bug report template
- **Feature ideas**: Use the feature request template
- **Security issues**: Email directly (see README)

## 🙏 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- Project documentation (for major features)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CoachScope! 🎓
