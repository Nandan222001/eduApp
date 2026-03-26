# Installation Guide for Presentation Generator

## Quick Start

### Option 1: Using the Root Project Dependencies

If you have already installed the project dependencies using Poetry or pip:

```bash
# The python-pptx dependency has been added to pyproject.toml
# Install all dependencies
poetry install

# Or update requirements.txt and install
poetry export -f requirements.txt -o requirements.txt
pip install -r requirements.txt
```

### Option 2: Install Only the Presentation Dependency

If you only want to run the presentation generator without installing the entire project:

```bash
# Navigate to the presentation folder
cd presentation

# Install using pip
pip install -r requirements.txt
```

### Option 3: Using Poetry (Add to Project)

The dependency is already added to `pyproject.toml`. Simply run:

```bash
poetry install
```

## Running the Presentation Generator

### From the Presentation Folder

```bash
cd presentation
python create_presentation.py
```

### From the Project Root

```bash
python presentation/create_presentation.py
```

### Using Poetry

```bash
poetry run python presentation/create_presentation.py
```

## Expected Output

When you run the script, you should see:

```
Generating Educational SaaS Platform Presentation...
  [1/13] Adding title slide...
  [2/13] Adding executive summary...
  [3/13] Adding platform overview...
  [4/13] Adding technology stack...
  [5/13] Adding core features...
  [6/13] Adding AI/ML capabilities...
  [7/13] Adding mobile app highlights...
  [8/13] Adding security & compliance...
  [9/13] Adding deployment & infrastructure...
  [10/13] Adding unique differentiators...
  [11/13] Adding roadmap...

  Saving presentation to: Educational_SaaS_Platform_Presentation.pptx

✓ Presentation generated successfully!
  Total slides: 15
  File: Educational_SaaS_Platform_Presentation.pptx
```

The generated PowerPoint file will be in the same directory where you ran the script.

## Troubleshooting

### ImportError: No module named 'pptx'

**Solution:** Install python-pptx:
```bash
pip install python-pptx
```

### Permission Error when Saving File

**Solution:** Make sure you don't have the PowerPoint file open in another application. Close any open instances of the presentation and try again.

### Python Version Issues

**Requirement:** Python 3.11+ (as specified in the project)

Check your Python version:
```bash
python --version
```

If needed, use a virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

## Customization

To customize the presentation, edit `create_presentation.py`:

- **Colors**: Modify the class variables `PRIMARY_COLOR`, `SECONDARY_COLOR`, `ACCENT_COLOR`
- **Content**: Update the content in each `add_*` method
- **Slide Order**: Change the order in the `generate()` method
- **Output Filename**: Pass a different filename to `generator.generate("custom_name.pptx")`

## Dependencies

- **python-pptx**: ^0.6.21
  - Creates and modifies PowerPoint (.pptx) files
  - Documentation: https://python-pptx.readthedocs.io/

## Support

For issues:
1. Check that python-pptx is properly installed: `pip list | grep python-pptx`
2. Verify Python version: `python --version` (should be 3.11+)
3. Review the error message and check file permissions
4. Refer to the main README.md for more details
