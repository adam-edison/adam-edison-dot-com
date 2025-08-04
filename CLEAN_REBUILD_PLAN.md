# Clean Rebuild Plan: New Repo with Good Architecture

## Goal
Build a high-quality personal portfolio site with contact form functionality from scratch, using good architecture principles and leveraging AI generation with human review.

## ✅ New Repository Setup

### 1. ✅ Create Template Repository
```bash
# Create new repo: adam-edison-portfolio-v2
mkdir adam-edison-portfolio-v2
cd adam-edison-portfolio-v2
git init
```

### 2. 🚧 Foundation Setup (Day 1: 2-3 hours)

* ✅ 1-husky-for-commit-messages
* ✅ 2-next-js-with-pages-router-and-tailwind
* 🚧 3-eslint-and-prettier
* 🚧 4-basic-landing-page
  * and here is where we introduce:
    * Agents in personal Claude for:
      * whole process coordination for new code given requirements
      * Software Architect -- Clean Architecture, review first, several steps along the way, generates skeleton after approval
      * Software Product Engineer -- asks questions to clarify requirements and acceptance criteria before writing tests
      * Software Test Engineer -- DI for everything, and mocking class methods where needed, writes tests as TDD
      * Software Implementation Engineer -- write production code in the skeleton to make tests pass, iterating until tests pass
      * Refactoring Engineer -- code style and quality checks
      * Last Line of Defense -- run all quality checks (format, lint, tests, build, server starts, .env.example is complete)
* 5-contact-page
    * Agents in personal Claude:
      * Security Engineer -- make recommendations to improve security if needed and make MD file with high, medium, low risks -- add to existing file or create new one in project .claude folder
      * security md file not in version control
* 6-email-integration
* 7-rate-limiting
* 8-anti-bot-measures
* 9-security-improvements
* 10-accessibility-improvements
* 11-performance-improvements
* 12-favicon
* 13-netlify-deployment


Copy essential configuration from current repo:

**Core Files to Copy:**
```bash
package.json (dependencies only)
next.config.ts
tsconfig.json  
tailwind.config.js
.eslintrc.json
.prettierrc
.gitignore
netlify.toml
```

**Clean Project Structure:**
```
src/
├── components/     # Reusable UI components
├── pages/         # Next.js pages
├── styles/        # Global styles
├── types/         # TypeScript definitions
├── utils/         # Utility functions
└── lib/           # Core business logic
```

**Initial Setup Commands:**
```bash
npm install
npm run dev  # Verify basic setup works
```

## Feature Development Plan

### Phase 1: Core Foundation (Day 1-2)
**Goal**: Basic site rendering with clean architecture

#### 1.1 Home Page (2-3 hours)
- **AI Generation**: "Create a clean home page component for a developer portfolio"
- **Human Review**: Refine component patterns, styling approach
- **Iterate**: Until home page meets your standards
- **Document**: Component patterns that work

#### 1.2 Navigation & Layout (1-2 hours)  
- **AI Generation**: "Create navigation and layout components using established patterns"
- **Human Review**: Refine layout architecture
- **Result**: Reusable layout system

#### 1.3 Resume Page (1 hour)
- **AI Generation**: "Create resume page using layout patterns"
- **Result**: Second page to validate patterns work

**Phase 1 Success Criteria:**
- [ ] Site renders correctly
- [ ] Clean component architecture established
- [ ] Navigation works
- [ ] Patterns documented for reuse

---

### Phase 2: Contact Form Foundation (Day 3-4)
**Goal**: Basic contact form without security features

#### 2.1 Form Components (2-3 hours)
- **AI Generation**: "Create contact form components with TypeScript"
- **Human Review**: Refine form patterns, validation approach
- **Iterate**: Until form architecture is solid

#### 2.2 Form State Management (1-2 hours)
- **AI Generation**: "Add form state management using established patterns"
- **Human Review**: Refine state patterns
- **Result**: Clean form state architecture

#### 2.3 Basic API Endpoint (1-2 hours)
- **AI Generation**: "Create basic contact API endpoint"
- **Human Review**: Establish API patterns
- **Result**: Working form submission (without security)

**Phase 2 Success Criteria:**
- [ ] Contact form renders and submits
- [ ] Form state patterns established
- [ ] API patterns defined
- [ ] Basic validation working

---

### Phase 3: Security Layer (Day 5-7)
**Goal**: Add comprehensive security features

#### 3.1 Input Validation & Sanitization (1 day)
- **Reference**: Analyze current validation patterns
- **AI Generation**: "Implement comprehensive input validation"
- **Human Review**: Refine validation architecture
- **Result**: Robust input validation system

#### 3.2 Rate Limiting (1 day)
- **Reference**: Current rate limiting implementation
- **AI Generation**: "Add rate limiting with Redis"
- **Human Review**: Refine rate limiting patterns
- **Result**: Multi-layer rate limiting

#### 3.3 CSRF Protection (1 day)
- **Reference**: Current CSRF implementation  
- **AI Generation**: "Add CSRF protection system"
- **Human Review**: Security review and refinement
- **Result**: CSRF protection implemented

**Phase 3 Success Criteria:**
- [ ] All security features working
- [ ] Security patterns established
- [ ] Security testing implemented
- [ ] No security vulnerabilities

---

### Phase 4: Advanced Features (Day 8-10)
**Goal**: Complete feature set with external integrations

#### 4.1 Turnstile Integration (1.5 days)
- **Reference**: Current Turnstile implementation
- **AI Generation**: "Implement Cloudflare Turnstile integration"
- **Human Review**: Refine integration patterns
- **Result**: VPN-friendly Turnstile protection

#### 4.2 Email Service (1.5 days)
- **Reference**: Current email patterns
- **AI Generation**: "Implement email service with Resend"
- **Human Review**: Refine email architecture
- **Result**: Reliable email delivery

**Phase 4 Success Criteria:**
- [ ] Turnstile fully functional
- [ ] Email service working
- [ ] External integration patterns established
- [ ] All features integrated smoothly

---

### Phase 5: Polish & Deploy (Day 11-12)
**Goal**: Production-ready site with monitoring

#### 5.1 Performance Optimization (0.5 day)
- **AI Generation**: "Optimize performance and bundle size"
- **Human Review**: Validate optimizations
- **Result**: Fast, optimized site

#### 5.2 Testing & Documentation (0.5 day)
- **AI Generation**: "Add comprehensive testing"
- **Human Review**: Validate test coverage
- **Result**: Well-tested, documented codebase

#### 5.3 Deployment Setup (1 day)
- **Setup**: Netlify deployment configuration
- **Testing**: Staging and production deployment
- **Result**: Deployed, monitored site

**Phase 5 Success Criteria:**
- [ ] Site deployed successfully
- [ ] Performance optimized
- [ ] Testing comprehensive
- [ ] Documentation complete

## Architecture Principles

### Component Architecture
- **Single Responsibility**: Each component has one clear purpose
- **Composition**: Build complex UI from simple components
- **Type Safety**: Full TypeScript coverage
- **Testability**: Components easy to test in isolation

### Service Architecture  
- **Separation of Concerns**: UI, business logic, data access separated
- **Dependency Injection**: Services easily mockable and testable
- **Error Handling**: Consistent error handling patterns
- **Configuration**: Environment-based configuration

### Security Architecture
- **Defense in Depth**: Multiple security layers
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: Multiple rate limiting strategies
- **Secure by Default**: Secure configurations as default

## Quality Process

### AI Generation + Human Review Loop
For each feature:
1. **Generate**: AI creates initial implementation
2. **Review**: Identify what you like/dislike
3. **Refine**: Update requirements and regenerate
4. **Repeat**: Until code meets your standards
5. **Document**: Capture patterns for future use

### Quality Gates
Each phase must pass:
- [ ] **Functionality**: Features work as intended
- [ ] **Code Quality**: Clean, readable, maintainable code
- [ ] **Type Safety**: Full TypeScript compliance
- [ ] **Testing**: Appropriate test coverage
- [ ] **Performance**: No performance regressions
- [ ] **Security**: Security review (for security features)

### Documentation
Maintain throughout development:
- **Architecture Decisions**: Why choices were made
- **Component Patterns**: Reusable patterns discovered
- **API Documentation**: Clear API contracts
- **Deployment Guide**: How to deploy and configure

## Expected Timeline

**Total: 12 days (2.5 weeks)**
- **Phase 1**: Days 1-2 (Foundation)
- **Phase 2**: Days 3-4 (Contact Form)
- **Phase 3**: Days 5-7 (Security)
- **Phase 4**: Days 8-10 (Advanced Features)
- **Phase 5**: Days 11-12 (Polish & Deploy)

## Success Metrics

### Technical Quality
- Clean, maintainable codebase
- Full TypeScript coverage
- Comprehensive security
- Excellent performance
- Well-tested functionality

### Process Quality
- Refined AI generation prompts
- Documented architecture patterns
- Reusable component library
- Clear deployment process

### Business Value
- Professional portfolio site
- Functional contact form
- Secure, reliable operation
- Fast, responsive user experience

## Risk Management

### Technical Risks
- **Complex integrations**: Start simple, add complexity gradually
- **Security vulnerabilities**: Security review at each phase
- **Performance issues**: Regular performance testing

### Process Risks
- **Scope creep**: Stick to defined phases
- **Over-engineering**: Focus on simplicity first
- **Time overruns**: Time-box each feature

## Next Steps

1. **Create Repository**: Set up new repo with foundation
2. **Phase 1 Start**: Begin with home page rendering
3. **Iterate**: Use AI generation + human review loop
4. **Document**: Capture learnings for future phases
5. **Progress**: Move through phases systematically

This plan provides a structured approach to building a high-quality site from scratch while leveraging your existing work as reference material and using AI to accelerate development with human oversight ensuring quality.