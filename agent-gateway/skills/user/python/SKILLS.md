# Python Skill

Python package and environment management.

## Commands

### Install Package
```
/python pip <package>
```
Install package with pip.

### Install Requirements
```
/python install <requirements.txt>
```
Install from requirements.

### List Packages
```
/python list
```
List installed packages.

### Freeze
```
/python freeze
```
Freeze to requirements.

### Virtual Env
```
/python venv <name>
```
Create virtual environment.

### Activate
```
/python activate <env>
```
Activate environment.

### Deactivate
```
/python deactivate
```
Deactivate environment.

### Run Script
```
/python run <script.py>
```
Run Python script.

### Check
```
/python check <file.py>
```
Check syntax.

### Format
```
/python format <file.py>
```
Format code (black).

### Lint
```
/python lint <file.py>
```
Lint code (ruff/pylint).

### Typecheck
```
/python typecheck <file.py>
```
Type check (mypy).

### Create Project
```
/python init <name>
```
Create project structure.

### Jupyter
```
/python notebook
```
Start Jupyter notebook.

## Examples

```
/python pip requests
/python install requirements.txt
/python list
/python freeze > requirements.txt
/python venv myenv
/python activate myenv
/python run app.py
/python check app.py
/python format app.py
/python lint app.py
/python typecheck app.py
/python init myproject
/python notebook
```
