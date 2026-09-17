package org.example.gestionrendezvousmedic.Controller;

import dev.langchain4j.model.language.LanguageModel;
import dev.langchain4j.model.ollama.OllamaLanguageModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    private final LanguageModel model;
    private final String websiteInfo;

    public ChatController(@Value("${website.info}") String websiteInfo,
                          @Value("${assistant.base-url}") String baseUrl,
                          @Value("${assistant.model}") String modelName) {
        this.websiteInfo = websiteInfo;
        try {
            this.model = OllamaLanguageModel.builder()
                    .baseUrl(baseUrl)
                    .modelName(modelName)
                    .timeout(Duration.ofSeconds(60))
                    .maxRetries(3)
                    .build();
            logger.info("Assistant language model initialised ({} @ {})", modelName, baseUrl);
        } catch (Exception e) {
            logger.error("Assistant initialisation failed: {}", e.getMessage(), e);
            throw new IllegalStateException("Impossible d'initialiser le modèle de l'assistant", e);
        }
    }

    @PostMapping
    @Async
    @Cacheable(value = "chatResponses", key = "#request.message")
    public CompletableFuture<ResponseEntity<String>> chat(@RequestBody ChatRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            logger.warn("Requête de chat invalide : {}", request);
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().body("La question ne peut pas être vide"));
        }

        String userQuestion = request.getMessage().replaceAll("[^a-zA-Z0-9\\s.,!?éèêëàâäôöùûüçÉÈÊËÀÂÄÔÖÙÛÜÇ]", "");
        logger.info("Question reçue : {}", userQuestion);

        try {
            String prompt = """
                Vous êtes un assistant utile pour le système de gestion des rendez-vous médicaux de Online-Doc.
                Fournissez des réponses concises et précises en français basées sur les informations suivantes.
                Ne spéculez pas et ne fournissez pas d'informations au-delà de ce qui est donné.
                Répondez uniquement en français, vous aider les clients a naviguer le site. soyez attentives et polis,
               

                Informations sur le site :
                %s

                Question de l'utilisateur : %s
                """.formatted(websiteInfo, userQuestion);

            String reply = model.generate(prompt).content(); // Correct usage for LanguageModel
            logger.debug("Réponse générée : {}", reply);
            return CompletableFuture.completedFuture(ResponseEntity.ok(reply));

        } catch (Exception e) {
            logger.error("Erreur lors de la génération de la réponse : {}", e.getMessage(), e);
            return CompletableFuture.completedFuture(
                    ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Désolé, une erreur s'est produite. Veuillez réessayer."));
        }
    }
}
