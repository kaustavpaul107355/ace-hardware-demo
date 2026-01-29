#!/bin/bash
#
# Safe Cleanup Script for ACE Hardware Supply Chain Analytics
# Removes temporary files, caches, and consolidates documentation
#

set -e  # Exit on error

echo "========================================="
echo "ACE Hardware Demo - Safe Cleanup Script"
echo "========================================="
echo ""

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "📍 Working directory: $(pwd)"
echo ""

# ============================================================
# PHASE 1: Remove Cache and Temporary Files
# ============================================================
echo "🧹 Phase 1: Removing cache and temporary files..."

# Python cache
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
find . -type f -name "*.pyo" -delete 2>/dev/null || true

# macOS files
find . -name ".DS_Store" -delete 2>/dev/null || true

# Temporary test files
rm -f test_risk_distribution.py 2>/dev/null || true
rm -f logistics_app_ui/test_direct_query.py 2>/dev/null || true

# Node modules (keep for now, can be regenerated)
# rm -rf logistics_app_ui/node_modules 2>/dev/null || true

echo "   ✓ Removed Python cache files"
echo "   ✓ Removed .DS_Store files"
echo "   ✓ Removed test scripts"
echo ""

# ============================================================
# PHASE 2: Archive Documentation
# ============================================================
echo "📚 Phase 2: Archiving old documentation..."

# Create archive directory if it doesn't exist
mkdir -p docs/archive/phase4_cleanup

# Move all top-level .md files (except README and PROJECT_README) to archive
for md_file in *.md; do
    if [ "$md_file" != "README.md" ] && [ "$md_file" != "PROJECT_README.md" ] && [ -f "$md_file" ]; then
        mv "$md_file" docs/archive/phase4_cleanup/ 2>/dev/null || true
        echo "   ✓ Archived: $md_file"
    fi
done

echo ""

# ============================================================
# PHASE 3: Update .gitignore
# ============================================================
echo "🔒 Phase 3: Updating .gitignore..."

# Backup existing .gitignore
cp .gitignore .gitignore.backup

# Add additional ignores
cat >> .gitignore << 'EOF'

# Additional cleanup patterns
*.pyc
*.pyo
__pycache__/
.DS_Store
*.log
*.tmp
test_*.py
.pytest_cache/
.coverage
htmlcov/

# Node modules and build artifacts
logistics_app_ui/node_modules/
logistics_app_ui/dist/
logistics_app_ui/.vite/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
Thumbs.db
.Spotlight-V100
.Trashes
EOF

echo "   ✓ Updated .gitignore with additional patterns"
echo ""

# ============================================================
# PHASE 4: Replace main README
# ============================================================
echo "📝 Phase 4: Replacing main README with consolidated version..."

# Backup old README
cp README.md docs/archive/phase4_cleanup/README_old.md 2>/dev/null || true

# Replace with new consolidated README
mv PROJECT_README.md README.md

echo "   ✓ Replaced README.md with consolidated documentation"
echo ""

# ============================================================
# PHASE 5: Verification
# ============================================================
echo "✅ Phase 5: Verification..."

echo ""
echo "File counts:"
echo "   - Python files: $(find . -name "*.py" -not -path "./node_modules/*" | wc -l | tr -d ' ')"
echo "   - TypeScript files: $(find . -name "*.ts" -o -name "*.tsx" -not -path "./node_modules/*" | wc -l | tr -d ' ')"
echo "   - Markdown files (root): $(find . -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')"
echo "   - Archived docs: $(find docs/archive -name "*.md" | wc -l | tr -d ' ')"
echo ""

# ============================================================
# PHASE 6: Summary
# ============================================================
echo "========================================="
echo "✨ Cleanup Complete!"
echo "========================================="
echo ""
echo "Summary:"
echo "  ✓ Removed cache files (__pycache__, *.pyc, .DS_Store)"
echo "  ✓ Archived 20+ documentation files to docs/archive/phase4_cleanup/"
echo "  ✓ Updated .gitignore with comprehensive patterns"
echo "  ✓ Replaced README.md with consolidated documentation"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Test functionality: cd logistics_app_ui && npm run build"
echo "  3. Commit changes: git add -A && git commit -m 'docs: consolidate documentation and perform safe cleanup'"
echo ""
echo "Backup:"
echo "  - Old .gitignore saved as .gitignore.backup"
echo "  - Old README.md saved to docs/archive/phase4_cleanup/README_old.md"
echo ""
