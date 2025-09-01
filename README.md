# University Course Planner 📚

A modern web application designed to help university students efficiently plan their course schedules, manage credits, and resolve time conflicts between lectures.

## ✨ Main Features

- **Smart Schedule Planning**: Create and manage lecture schedules with visual time grids
- **Conflict Detection**: Automatically identify and highlight time conflicts between courses
- **Conflict Eliminator**: Interactive swipe-based interface to resolve scheduling conflicts
- **Multi-Week Matrix View**: Visualize courses across multiple weeks at a glance  
- **Credit Tracking**: Monitor total credits and categorize by mandatory/optional courses
- **Course Management**: Add, edit, archive, and restore courses with custom colors
- **Data Export**: Export schedules to CSV format for external use
- **Data Import**: Bulk import course data through dedicated import panel
- **Archive System**: Keep track of inactive courses without losing data
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Tech Stack

- **Framework**: Next.js 15.5 with React 19
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS 4.0
- **TypeScript**: Full type safety throughout the application
- **Deployment Ready**: Optimized for production deployment

## 🏗️ Database Schema

The application uses a simple yet effective SQLite database with two main tables:

- **Courses**: Store course information including name, credits, type (mandatory/optional), colors, and archive status
- **Sessions**: Individual lecture sessions with date, time, and course associations

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/uni-planner.git
   cd uni-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Initialize the database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations

## 🛠️ Development

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (pages)/          # Application pages
│   └── actions.ts        # Server actions
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── planner/         # Schedule planning components
│   ├── eliminator/      # Conflict resolution components
│   └── ...
├── db/                  # Database configuration
├── lib/                # Utility functions
└── auth.ts             # Authentication setup
```

### Adding New Features

1. **Database Changes**: Update schema in `src/db/schema.ts` and run migrations
2. **API Routes**: Add server actions in `src/app/actions.ts` 
3. **UI Components**: Create reusable components in `src/components/ui/`
4. **Pages**: Add new pages in the `src/app/` directory following Next.js 13+ conventions

### Code Style Guidelines

- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Implement proper error handling
- Add appropriate loading states
- Ensure responsive design
- Write semantic HTML

## 🧪 Testing

Currently, the project uses ESLint for code quality. To run linting:

```bash
npm run lint
```

*Note: Unit and integration tests are not yet implemented but contributions are welcome!*

## 🚀 Deployment

### Vercel (Recommended)

1. Fork this repository
2. Connect your GitHub account to Vercel
3. Import the project
4. Add environment variables in Vercel dashboard
5. Deploy!

### Other Platforms

The application can be deployed on any platform supporting Node.js:

- Railway
- Heroku  
- DigitalOcean App Platform
- AWS Amplify
- Netlify

Ensure you configure the database and environment variables for your chosen platform.

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add appropriate documentation
   - Test your changes thoroughly
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Contribution Guidelines

- **Code Quality**: Ensure your code passes linting and follows TypeScript best practices
- **Documentation**: Update README and add JSDoc comments for complex functions
- **Backwards Compatibility**: Avoid breaking changes when possible
- **Performance**: Consider the impact on application performance
- **Accessibility**: Ensure new features are accessible to all users

### Areas for Contribution

- [ ] Unit and integration tests
- [ ] Additional export formats (PDF, iCal)
- [ ] Advanced filtering and search
- [ ] Mobile app development
- [ ] Internationalization (i18n)
- [ ] Dark/light theme improvements
- [ ] Performance optimizations
- [ ] Accessibility improvements

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

The MIT License allows for:
- ✅ Commercial use
- ✅ Distribution  
- ✅ Modification
- ✅ Private use

**Note**: While this project is open source under MIT license, the original creator retains the right to monetize derivative works and commercial implementations.

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/your-username/uni-planner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/uni-planner/discussions)
- **Email**: your-email@example.com

## 🎯 Roadmap

### Short Term
- [ ] Add comprehensive test suite
- [ ] Implement data import/export improvements
- [ ] Mobile responsiveness enhancements
- [ ] Performance optimizations

### Medium Term  
- [ ] Multi-university support
- [ ] Collaborative planning features
- [ ] Advanced analytics and insights
- [ ] Mobile application

### Long Term
- [ ] AI-powered schedule optimization
- [ ] Integration with university systems
- [ ] Multi-language support
- [ ] Advanced reporting features

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Vercel** for hosting and deployment platform
- **Tailwind CSS** for the utility-first CSS framework
- **Drizzle Team** for the TypeScript ORM
- **All contributors** who help improve this project

---

**Made with ❤️ for students by students**

*If this project helps you manage your studies better, please consider giving it a ⭐ on GitHub!*
