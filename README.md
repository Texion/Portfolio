# Portfolio Laurent Schaeffer

Premier jet d’un portfolio statique à navigation spatiale.

## Lancer en local

Ouvrir `index.html` suffit pour visualiser le site. Pour tester les chemins HTTP :

```bash
python -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.

## Formulaire de contact

Le formulaire poste vers `contact.php`, qui envoie les messages à `laurent.schaeffer20@gmail.com` via `mail()`.

Pour un envoi réel, le site doit être hébergé sur un serveur PHP avec un service mail configuré. Sans serveur mail local, le JavaScript ouvre automatiquement un email prérempli en repli.
